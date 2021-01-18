import moment from 'moment'

let filterFunction = "";

function filterFn(val) {
    if(isNaN(val)) {
        return "";
    } else {
        return Function('val', filterFunction)(val);
    }
}

export function calcResult(rawData, configs) {
    self.postMessage('msg建立計算參數...');
    filterFunction = configs.filterFunction;
    let rankArray = new Array();
    let sumArray = new Array();
    let valueArray = new Array();
    let labelArray = new Array();
    let overallRank = {
        title: "總體累計",
        data: new Array(),
        sum: 0,
        dataArray: new Array(),
        labelArray: new Array()
    };
    let tempArr = new Array();
    let DataArr = new Array();
    self.postMessage('msg開始分析資料概況...');
    rawData.forEach((item) => {
        if(tempArr[item.name] === undefined) {
            tempArr[item.name] = {
                value: 1,
                data: filterFn(parseInt(item.data, 10))
            };
        } else {
            tempArr[item.name].value++;
            tempArr[item.name].data += filterFn(parseInt(item.data, 10));
        }
    });
    self.postMessage('msg計算統計概況...');
    Object.keys(tempArr).forEach((item) => {
        DataArr.push({
            itemname: item,
            itemvalue: tempArr[item].value,
            itemdata: tempArr[item].data
        });
        overallRank.sum += parseInt(tempArr[item].value, 10);
    });
    DataArr.sort((a, b) => {
        return b.itemvalue - a.itemvalue;
    });
    DataArr.forEach((item) => {
        overallRank.labelArray.push(item.itemname);
        overallRank.dataArray.push(item.itemvalue);
        overallRank.data.push({
            itemname: item.itemname,
            itemvalue: item.itemvalue,
            itemdata: item.itemdata
        });
    });
    overallRank.distItem = Object.keys(tempArr).length;
    rankArray.push(overallRank);
    self.postMessage('msg統計概況計算完成，計算分時段統計...');
    let datePointer = moment(configs.startDate, "YYYY-MM-DD");
    let endDate = moment(configs.endDate, "YYYY-MM-DD")
    while(endDate.diff(datePointer) > 0) {
        let newPointer = moment();
        if(!configs.monthControl) {
            newPointer = configs.monthReset ? moment(datePointer.toDate()).endOf(configs.spanUnit).add(1, 'days') : moment(datePointer.toDate()).add(configs.spanValue, configs.spanUnit);
        } else {
            newPointer = moment(datePointer.toDate()).add(configs.spanValue, configs.spanUnit);
        }
        let tempRank = {
            title: datePointer.format("YYYY-MM-DD")+"~"+newPointer.format("YYYY-MM-DD")+"排行",
            data: new Array(),
            dataArray: new Array(),
            labelArray: new Array(),
            sum: 0
        };
        tempArr = new Array();
        DataArr = new Array();
        self.postMessage('msg正在分析：' + datePointer.format("YYYY-MM-DD HH:mm:ss") + "~" + newPointer.format("YYYY-MM-DD HH:mm:ss") + "...");
        rawData.forEach((item) => {
            if(moment.unix(item.date).isBetween(datePointer, newPointer)) {
                if(tempArr[item.name] === undefined) {
                    tempArr[item.name] = {
                        value: 1,
                        data: filterFn(parseInt(item.data, 10))
                    };
                } else {
                    tempArr[item.name].value++;
                    tempArr[item.name].data += filterFn(parseInt(item.data, 10));
                }
            }
        });
        self.postMessage('msg正在處理：' + datePointer.format("YYYY-MM-DD HH:mm:ss") + "~" + newPointer.format("YYYY-MM-DD HH:mm:ss") + "...");
        Object.keys(tempArr).forEach((item) => {
            DataArr.push({
                itemname: item,
                itemvalue: tempArr[item].value,
                itemdata: tempArr[item].data
            });
            tempRank.sum += parseInt(tempArr[item].value, 10);
        });
        DataArr.sort((a, b) => {
            return b.itemvalue - a.itemvalue;
        });
        DataArr.forEach((item) => {
            tempRank.labelArray.push(item.itemname);
            tempRank.dataArray.push(item.itemvalue);
            tempRank.data.push({
                itemname: item.itemname,
                itemvalue: item.itemvalue,
                itemdata: item.itemdata
            });
        });
        self.postMessage('msg' + datePointer.format("YYYY-MM-DD HH:mm:ss") + "~" + newPointer.format("YYYY-MM-DD HH:mm:ss") + "計算完成！");
        tempRank.distItem = Object.keys(tempArr).length;
        sumArray.push(tempRank.sum);
        labelArray.push(tempRank.title);
        rankArray.push(tempRank);
        datePointer = newPointer;
    }
    self.postMessage('msg統計結束！');
    return {
        rankArray: rankArray,
        sumArray: sumArray,
        valueArray: valueArray,
        labelArray: labelArray,
        calcDone: true
    }
}