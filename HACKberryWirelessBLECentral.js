/*
=================================================================
HACKberry Wireless BLE Central
=================================================================

*/

// include Library
document.write("<script type='text/javascript' src='bluejelly.js'></script>");
document.write("<script type='text/javascript' src='smoothie.js'></script>");

// Objects Generation
var bleSensor  = new BlueJelly();
var bleHand    = new BlueJelly();
var dataSensor = new TimeSeries();

// Global variables
var TargetValue = 0;
var SyncFlag = true;
var TestTargetValue = 0;

// Timeline
function createSensorTimeline() {
  var chart = new SmoothieChart({
      millisPerPixel: 20,
      grid: {
          fillStyle: '#ff8319',
          strokeStyle: '#ffffff',
          millisPerLine: 800
      },
      maxValue: 1024,
      minValue: 0
  });
  chart.addTimeSeries(dataSensor, {
      strokeStyle: 'rgba(255, 255, 255, 1)',
      fillStyle: 'rgba(255, 255, 255, 0.2)',
      lineWidth: 4
  });
  chart.streamTo(document.getElementById("sensorChart"), 500);
}

var handTimerID = null;
var stTimerID = null;
var chartTimerID = null;
var sensorTesterFlag = 1;

var publishSensor = function () {
    console.log('bleHand > publishing....');
    bleHand.write('HbHandTargetUUID', String(TargetValue));
}

var sensorTester = function () {
    console.log("blehand > sensortester");
    if ( TargetValue > 1024 ) {
        sensorTesterFlag = -1;
    } else if ( TargetValue < 100 ) {
        sensorTesterFlag = 1;
    }
    TargetValue = parseInt(sensorTesterFlag * 10) + parseInt(TargetValue);
    SyncFlag = true;
    console.log("blehand > sensortester TargetValue is " + String(TargetValue));
}

var chartSync = function() {
    console.log('BLEHand > syncing...');
    if ( SyncFlag )
        dataSensor.append(new Date().getTime(), TargetValue);
    else
        dataSensor.append(new Date().getTime(), 0);
}

function startChartSync() {
    cnosole.log('BLEHand > started chart sync');
    if ( chartTimerID == null )
        chartTimerID = setInterval(chartSync,100);
}

function stopChartSync() {
    console.log('BLEHand > stopped chart sync')
    if ( chartTimerID != null )
        clearInterval(chartTimerID);
    chartTimerID = null;
}

function startHandSync() {
    console.log('BLEHand > Started Writing Tiemr.');
    if ( handTimerID == null)
        handTimerID = setInterval( publishSensor, 100);
}

function stopHandSync() {
    console.log('BLEHand > Stopped Writing Tiemr.');
    if ( handTimerID != null)
        clearInterval(handTimerID);
    handTimerID = null;
}

function startSensorTester() {
    console.log('blehand > sensor tester started');
    if ( stTimerID == null)
        stTimerID = setInterval( sensorTester, 100);
}

function stopSensorTester() {
    console.log('blehand > sensor tester stoppted');
    if ( stTimerID != null)
        clearInterval(stTimerID);
    stTimerID = null;
}


// Process when loading HTML file
window.onload = function() {
  // UUID Configuration
  bleSensor.setUUID("HbSensorSensorUUID",
              "2a868b46-306e-4ae8-98fa-1389802f6bf5",
              "4b5c51d5-b39e-4922-ad8c-e5fbe37cb71c"
  );
  bleHand.setUUID("HbHandTargetUUID",
              "b436a215-cf24-4ae4-b10d-3d842fec6bd2",
              "bc25d7b5-d92f-4d45-bdaa-cc0b04b81511"
  );
  bleHand.setUUID("HbHandBatteryUUID",
              "b436a215-cf24-4ae4-b10d-3d842fec6bd2",
              "8826547a-eb87-43ec-9a6c-68de15c46ad9"
  );
  bleHand.setUUID("HbHandHandStatUUID",
              "b436a215-cf24-4ae4-b10d-3d842fec6bd2",
              "3a87338a-c109-4ff6-9694-1975f33eb635"
  );

  createSensorTimeline();
}

/*
 * Processes for bleSensor
 *
 *      onScan : process after scan
 *      onConnectGatt : process after ConnectGATT
 *      onRead : process after read
 *      onStartNotify : process after start notify
 *      onReset : process after reset
 */
bleSensor.onScan = function (deviceName) {
    console.log('BLESensor > Scanning Device');

    document.getElementById('sensorDeviceName').innerHTML = "DeviceName: " + deviceName;
    document.getElementById('sensorConnection').innerHTML = "Connection: " + "Connected!";
}

bleSensor.onConnectGATT = function (uuid) {
    console.log('BLESensor > Connected GATT!');

    document.getElementById('sensorSensorUUIDName').innerHTML = "UUDI: " + uuid;
    document.getElementById('sensorConnectionStatus').innerHTML = "GATT: " + "Connected!";
}

bleSensor.onRead = function (data, uuid) {
    console.log('BLESensor > Read data.');

    // get value
    var value = parseInt( data.getUint8(0) ) * 256 + parseInt( data.getUint8(1) );
    TargetValue = value;
    console.log('BLESensor > Read data' );
    console.log('BLESensor >> data byte length ' + String(data.byteLength));
    console.log('BLESensor >> data byte offset ' + String(data.byteOffset));
    for(var i=0; i<data.byteLength; i++) {
        console.log('BLESensor >> ' + (i + 1) + ' th byte is ' + data.getUint8(i) + ' in uint8');
    }

    // display the value on HTML
    document.getElementById('sensorSensorDataText').innerHTML = "SensorData: " + String(value);
    document.getElementById('sensorConnectionStatus').innerHTML = "GATT: " + "Read a data";

    //グラフへ反映
    //dataSensor.append(new Date().getTime(), value);
}

bleSensor.onWrite = function (uuid) {
    console.log('BLESensor > Write data.');
}

bleSensor.onStartNotify = function (uuid) {
    console.log('BLESensor > Start Notify');
    document.getElementById('sensorConnectionStatus').innerHTML = "GATT: " + "Started Notify";
}

bleSensor.onStopNotify = function (uuid) {
    console.log('BLESensor > Stop Notify');
    document.getElementById('sensorConnectionStatus').innerHTML = "GATT: " + "Stopped Notify";
}

bleSensor.onDisconnect = function (uuid) {
    console.log('BLESensor > Disconnected!');

    document.getElementById('sensorDeviceName').innerHTML = "Device: " + "No Device";
    document.getElementById('sensorSensorUUIDName').innerHTML = "UUID: " + "Not Connected";
    document.getElementById('sensorSensorDataText').innerHTML = "SensorData: " + "";
    document.getElementById('sensorConnection').innerHTML = "Connection" + "Disconnected";
    document.getElementById('sensorConnectionStatus').innerHTML = "GATT: " + "Disconnected";
}

bleSensor.onReset = function() {
    console.log('BLESensor > Resetted!');

    document.getElementById('sensorDeviceName').innerHTML = "Device: " + "No Device";
    document.getElementById('sensorSensorUUIDName').innerHTML = "UUID: " + "Not Connected";
    document.getElementById('sensorSensorDataText').innerHTML = "SensorData: " + "";
    document.getElementById('sensorConnection').innerHTML = "Connection" + "Disconnected";
    document.getElementById('sensorConnectionStatus').innerHTML = "GATT: " + "Disconnected";
}

/*
 * Processes for bleHand
 *
 *      onScan : process after scan
 *      onConnectGatt : process after ConnectGATT
 *      onRead : process after read
 *      onStartNotify : process after start notify
 *      onReset : process after reset
 */
bleHand.onScan = function (devicename) {
    console.log('BLEhand > Scanning Device...');

    document.getElementById('handDeviceName').innerHTML = "DeviceName: " + devicename;
    document.getElementById('handConnection').innerHTML = "Connection: " + "Connected!";
}

bleHand.onConnectGATT = function (uuid) {
    console.log('BLEHand > Connected GATT. uuid=' + uuid);

    switch(uuid) {
        case "HbHandTargetUUID":
            document.getElementById('handUUIDNameTarget').innerHTML = "TargetUUID: " + uuid;
            document.getElementById('handConnectionStatusTarget').innerHTML = "GATT Target: " + "Connected!";
            break;
        case "HbHandBatteryUUID":
            document.getElementById('handUUIDNameBattery').innerHTML = "BatteryUUID: " + uuid;
            document.getElementById('handConnectionStatusBattery').innerHTML = "GATT Battery: " + "Connected!";
            break;
        case "HbHandHandStatUUID":
            document.getElementById('handUUIDNameHandStat').innerHTML = "HandStatUUID: " + uuid;
            document.getElementById('handConnectionStatusHandStat').innerHTML = "GATT HandStat: " + "Connected!";
            break;
        default:
            console.log('BLEHand > Unknown GATT Found!')
            break;
    }
}

bleHand.onRead = function(data, uuid) {

    var value;

    console.log('BLESensor > Read data' );
    console.log('BLESensor >> data byte length ' + String(data.byteLength));
    console.log('BLESensor >> data byte offset ' + String(data.byteOffset));
    for(var i=0; i<data.byteLength; i++) {
        console.log('BLESensor >> ' + (i + 1) + ' th byte is ' + data.getUint8(i) + ' in uint8')
    }
    console.log('BLESensor >> data byte offset ' + String(data.byteOffset));

    switch (uuid) {
        case "HbHandTargetUUID":
            console.log('BLEHand > The central device recieved a data from Target GATT. Something goes wrong.');
            break;

        case "HbHandBatteryUUID":
            // value = data.getUint16(0);
            value = parseInt( data.getUint8(0) ) * 16 + parseInt( data.getUint8(1) );
            document.getElementById('handBatteryDataText').innerHTML = "BatteryData: " + String(value);
            document.getElementById('handConnectionStatusBattery').innerHTML = "GATT Battery: " + "Read a data.";
            break;

        case "HbHandHandStatUUID":
            value = data.getUint8(0);
            document.getElementById('handHandStatDataText').innerHTML = "HandStatData: " + String(value);
            document.getElementById('handConnectionStatusHandStat').innerHTML = "GATT HandStat: " + "Read a data.";
            break;
    }
}


bleHand.onWrite = function(uuid) {
    console.log('BLEHand > Write a data.');

    switch (uuid) {
        case "HbHandTargetUUID":
            document.getElementById('handTargetDataText').innerHTML = "TargetData: " + String(TargetValue);
            document.getElementById('handConnectionStatusTarget').innerHTML = "GATT Target: " + "Sent a data.";
            break;

        case "HbHandBatteryUUID":
            console.log("BLEHand > The central device sent a data to Battery GATT. Something goes wrong.");
            break;

        case "HbHandHandStatUUID":
            console.log("BLEHand > The central device sent a data to HandStat GATT. Something goes wrong.");
            break;
    }
}

bleHand.onStartNotify = function (uuid) {
    console.log('BLEHand > Start Notify.');
}

bleHand.onStopNotify = function (uuid) {
    console.log('BLEHand > Stop Notify.');
}

bleHand.onDisconnect = function (uuid) {
    console.log('BLEHand > Disconnected!');

    document.getElementById('handDeviceName').innerHTML = "DeviceName: " + "No Device";
    document.getElementById('handUUIDNameTarget').innerHTML = "TargetUUID: " + "Disconnected";
    document.getElementById('handTargetDataText').innerHTML = "TargetData: " + "None";
    document.getElementById('handUUIDNameBattery').innerHTML = "BatteryUUID: " + "Disconnected";
    document.getElementById('handBatteryDataText').innerHTML = "BatteryData: " + "None";
    document.getElementById('handUUIDNameHandStat').innerHTML = "HandStatUUID: " + "Disconnected";
    document.getElementById('handHandStatDataText').innerHTML = "HandStatData: " + "None";
    document.getElementById('handConnection').innerHTML = "Connection: " + "Disconnected";
    document.getElementById('handConnectionStatusTarget').innerHTML = "GATT Target: " + "Disconnected";
    document.getElementById('handConnectionStatusBattery').innerHTML = "GATT Battery: " + "Disconnected";
    document.getElementById('handConnectionStatusHandStat').innerHTML = "GATT HandStat: " + "Disconnected";
}

bleHand.onReset = function() {
    console.log('BLEHand > Resetted!');

    document.getElementById('handDeviceName').innerHTML = "DeviceName: " + "No Device";
    document.getElementById('handUUIDNameTarget').innerHTML = "TargetUUID: " + "Disconnected";
    document.getElementById('handTargetDataText').innerHTML = "TargetData: " + "None";
    document.getElementById('handUUIDNameBattery').innerHTML = "BatteryUUID: " + "Disconnected";
    document.getElementById('handBatteryDataText').innerHTML = "BatteryData: " + "None";
    document.getElementById('handUUIDNameHandStat').innerHTML = "HandStatUUID: " + "Disconnected";
    document.getElementById('handHandStatDataText').innerHTML = "HandStatData: " + "None";
    document.getElementById('handConnection').innerHTML = "Connection: " + "Disconnected";
    document.getElementById('handConnectionStatusTarget').innerHTML = "GATT Target: " + "Disconnected";
    document.getElementById('handConnectionStatusBattery').innerHTML = "GATT Battery: " + "Disconnected";
    document.getElementById('handConnectionStatusHandStat').innerHTML = "GATT HandStat: " + "Disconnected";
}
