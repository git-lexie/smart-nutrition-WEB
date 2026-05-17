export const connectScale = async (onWeight: (w: number) => void) => {
  try {
    // @ts-ignore - Navigator bluetooth types are experimental
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['weight_scale'] }], 
      optionalServices: ['weight_scale']
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('weight_scale');
    const characteristic = await service.getCharacteristic('weight_measurement');
    
    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (e: any) => {
      const val = e.target.value;
      // Basic Metric parsing logic (adjust based on specific scale manufacturer)
      const weight = val.getUint16(1, true) * 0.005; 
      onWeight(Math.round(weight * 100) / 100); 
    });
    return true;
  } catch (err) {
    console.error(err);
    alert("Bluetooth cancelled or not supported.");
    return false;
  }
};