import { BluetoothDevice, BluetoothRemoteGATTCharacteristic } from '../types';

export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  /**
   * Request a device with Heart Rate service
   */
  public async requestDevice(): Promise<BluetoothDevice> {
    // @ts-ignore - navigator.bluetooth is experimental
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth API is not available in this browser.");
    }

    try {
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['heart_rate']
      });
      this.device = device;
      return device;
    } catch (error) {
      console.error("Error requesting device:", error);
      throw error;
    }
  }

  /**
   * Connect to the device and start notifications
   */
  public async connect(
    onHeartRateChanged: (bpm: number) => void,
    onDisconnected: () => void
  ): Promise<void> {
    if (!this.device || !this.device.gatt) {
      throw new Error("No device selected.");
    }

    try {
      const server = await this.device.gatt.connect();
      
      this.device.addEventListener('gattserverdisconnected', () => {
        onDisconnected();
      });

      const service = await server.getPrimaryService('heart_rate');
      this.characteristic = await service.getCharacteristic('heart_rate_measurement');

      await this.characteristic.startNotifications();
      
      this.characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value as DataView;
        const bpm = this.parseHeartRate(value);
        onHeartRateChanged(bpm);
      });

    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    }
  }

  public disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
  }

  /**
   * Parse the Heart Rate Measurement Characteristic
   * Format defined by Bluetooth SIG
   */
  private parseHeartRate(value: DataView): number {
    // The first byte contains flags
    const flags = value.getUint8(0);
    
    // Check the Least Significant Bit (LSB) of the flags
    // 0 = Heart Rate Value Format is UINT8
    // 1 = Heart Rate Value Format is UINT16
    const rate16Bits = flags & 0x1;
    
    let bpm: number;
    if (rate16Bits) {
      bpm = value.getUint16(1, true); // Little-endian
    } else {
      bpm = value.getUint8(1);
    }
    return bpm;
  }
}

export const bluetoothService = new BluetoothService();
