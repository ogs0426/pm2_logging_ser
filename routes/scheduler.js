const scheduler = require('node-schedule');
const { schedule } = require('../config');
const mapper = require('../mapper/systemMapper')

const os = require('os');
const _ = require('lodash');
const {currentLoad, mem} = require('systeminformation');

const getSystemInfo = async () => {
    let cpuLoad = await currentLoad();
    let memInfo = await mem();
    let processMem = process.memoryUsage();

    let cpu = _.round(cpuLoad.currentload, 2);

    let totalSize = memInfo.total,
        used =  memInfo.used;

    let memory = _.round(used / totalSize * 100, 2),
        memoryFree = _.round(memInfo.free/1024/1024/1024, 2),
        memoryTotal = _.round(totalSize/1024/1024/1024, 2);

    let ip = getIpAddress();

    let heapUsed = processMem.heapUsed;
    let heapCommitted = processMem.rss - (processMem.heapTotal - processMem.external);
    
    return {
        cpu, 
        memoryTotal,
        memoryFree,
        memory,
        ip,
        heapUsed,
        heapCommitted
    }
        
};
const getIpAddress = () => {
    let interfaces = os.networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)  {
                return alias.address;
            }
        }
    }

    return '0.0.0.0';
};

const setScheduler = async () => {
    if (schedule.useSystemOperating === 'Y') {
        let sysInfo = await getSystemInfo();
        console.log(JSON.stringify(sysInfo))
        let res = await mapper.addHistory(sysInfo);
        console.log('=================> scedule Result : ' + JSON.stringify(res));
        console.log('=================> scedule info : ' + JSON.stringify(sysInfo));
    }
}

scheduler.scheduleJob('*/1 * * * *', async () => {
    setScheduler();
});
