<template>
  <v-app>
        <v-dialog
            v-model="loadW"
            persistent
            max-width="40vw"
        >
        <v-card>
            <v-card-title class="headline">
            計算中，請稍後
            </v-card-title>
            <v-card-text>
                {{ calcStatus }}
                <div class='red--text text-caption'>提示：統計完成後，「統計圖表」和「匯出結果」兩項功能便可使用，如果你要計算其他資料或是調整區間，建議關閉程式重啟再選一次</div>
            </v-card-text>
        </v-card>
        </v-dialog>
      <v-card>
          <v-card-text>
              <v-tabs
                  v-model="tab"
                  background-color="transparent"
                  color="basil"
                  grow
              >
                  <v-tab>使用說明</v-tab>
                  <v-tab>載入資料</v-tab>
                  <v-tab :disabled='!calcCompleted'>統計圖表</v-tab>
                  <v-tab :disabled='!calcCompleted'>匯出清單</v-tab>
              </v-tabs>
          
              <v-tabs-items v-model="tab">
                  <v-tab-item>
                      <ol>
                          <li>當你需要逐年或逐月跑出次數分配表，並繪製折線圖的時候，你會用到這套程式</li>
                      </ol>
                  </v-tab-item>
                  <v-tab-item>
                      <v-stepper
                          v-model='step'
                          vertical
                      >
                          <v-stepper-step
                              step="1"
                          >
                              讀入清單
                              <small>讀入你想要拿來畫逐月統計圖的清單</small>
                          </v-stepper-step>
                      
                          <v-stepper-content step="1">
                              <v-card>
                                  <v-card-text>
                                      <v-file-input
                                          @change="readColumn"
                                          label="原始資料CSV(UTF-8編碼)"
                                          accept=".csv"
                                      ></v-file-input>
                                  </v-card-text>
                                  <v-card-actions>
                                      <v-btn @click="step = 2">下一步</v-btn>
                                  </v-card-actions>
                              </v-card>
                          </v-stepper-content>
                          <v-stepper-step
                              step="2"
                          >
                              選擇欄位
                              <small>選擇資料欄位</small>
                          </v-stepper-step>
                      
                          <v-stepper-content step="2">
                              <v-card>
                                  <v-card-text>
                                      <v-select :items="columns" item-text="text" item-value="value" label="請選擇名稱欄位" v-model="itemcolumn"></v-select>
                                      <v-text-field label="篩選特定值" v-model='nameRegex'></v-text-field>
                                      <p class='red--text text-caption'>使用正規表達式，建議你先了解<a href="https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Guide/Regular_Expressions" target="_blank">語法</a>再到<a href="https://regex101.com/" target="_blank">這裡</a>玩玩看再來用</p>
                                      <v-select :items="columns" item-text="text" item-value="value" label="請選擇日期欄位" v-model="datecolumn"></v-select>
                                      <v-text-field label="日期格式" v-model='dateFormat'></v-text-field>
                                      <p class='red--text text-caption'>請參考moment.js格式，<a href="https://momentjs.com/docs/#/parsing/string-format/" target="_blank">點這裡</a></p>
                                      <v-switch v-model="dataAppend" label="加掛資料欄位"></v-switch>
                                      <v-select :disabled="!dataAppend" :items="columns" item-text="text" item-value="value" label="請選擇資料欄位" v-model="datacolumn"></v-select>
                                      <v-text-field :disabled="!dataAppend" label="自訂資料濾鏡" v-model='filterFunction'></v-text-field>
                                      <p class='red--text text-caption'>X代表資料，例如X*5代表把資料都*5</p>
                                      <v-text-field label="排行榜列出前N筆？" v-model='otherCount'></v-text-field>
                                      <p class='red--text text-caption'>統計中會列出前幾名的排序，之後的會歸入「其他」</p>
                                  </v-card-text>
                                  <v-card-actions>
                                      <v-btn @click="readRange">下一步</v-btn>
                                  </v-card-actions>
                              </v-card>
                          </v-stepper-content>
                          <v-stepper-step
                              step="3"
                          >
                              篩選區間
                              <small>設定你的篩選的區間和間隔</small>
                          </v-stepper-step>
                      
                          <v-stepper-content step="3">
                              <v-card>
                                  <v-card-text>
                                      <div class='text-h6'>日期區間</div>
                                      <div class='text-body-2'>共讀入{{ rawData.length }}筆資料，起始日期為{{ startDate }}，結束日期為：{{ endDate }} </div>
                                      <v-date-picker
                                          v-model="daterange"
                                          range
                                      ></v-date-picker>
                                      <v-text-field label="每隔多長時間設為一個群組" v-model='spanValue'></v-text-field>
                                      <v-select :items="spanUnitArr" item-text="name" item-value="value" label="時間單位" v-model="spanUnit"></v-select>
                                      <v-switch v-model="monthReset" label="年月對齊1號" :disabled="monthControl"></v-switch>
                                  </v-card-text>
                                  <v-card-actions>
                                      <v-btn @click="calcResult">開始繪製</v-btn>
                                  </v-card-actions>
                              </v-card>
                          </v-stepper-content>
                      </v-stepper>
                  </v-tab-item>
                  <v-tab-item>
                      <v-card flat>
                        <v-card-text>
                            <div class="text-h6">資料概況：（本頁中的「次數」欄位為： {{ itemcolumnname }} <span v-if='dataAppend'>／「資料」欄位為： {{ datacolumnname }} </span>，逐{{ spanWord }}累計而成）</div>
                            <v-sheet class="d-flex flex-row flex-wrap" style="width: 80vw">
                                <v-card class="flex-grow-1" v-for="item in rankArray" :key="item.title+'BL'">
                                    <v-card-title class="text-caption">{{ item.title }}</v-card-title>
                                    <v-card-text class="text-body-1">
                                        <div>項目數： {{ item.distItem }}</div>
                                        <div>次數：{{ item.sum }}</div>
                                        <div v-if="dataAppend">資料： {{ dataSumup(item.data) }}</div>
                                    </v-card-text>
                                </v-card>
                            </v-sheet>
                            <v-sheet class="chartArea">
                                <line-chart :height='100' :chart-data='lineData' :options='barOptions'></line-chart>
                            </v-sheet>
                            <v-sheet class="d-flex flex-row flex-wrap">
                                <v-sheet class="flex-grow-1" v-for="(item) in rankArray" :key="item.key" style="width:25vw">
                                    <div class="text-h6">{{ item.title }}（共 {{ item.distItem }} 項 ／  {{ item.sum }} 個）</div>
                                    <v-sheet class="pieArea">
                                        <pie-chart :height="350" :chart-data='createPie(topnBuildup(item))'></pie-chart>
                                    </v-sheet>
                                    <v-simple-table>
                                        <template v-slot:default>
                                        <thead>
                                            <tr>
                                                <th class="text-left">
                                                    項目
                                                </th>
                                                <th class="text-left">
                                                    次數
                                                </th>
                                                <th class="text-left" v-if="dataAppend">
                                                    資料
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="value in (topnBuildup(item)).data" :key="value.itemname+value.itemvalue">
                                                <td>{{ value.itemname }}</td>
                                                <td>{{ value.itemvalue }}</td>
                                                <td v-if="dataAppend">{{ value.itemdata }}</td>
                                            </tr>
                                        </tbody>
                                        </template>
                                    </v-simple-table>
                                </v-sheet>
                            </v-sheet>
                        </v-card-text>
                      </v-card>
                  </v-tab-item>
                  <v-tab-item>
                        <v-sheet class="d-flex flex-row flex-wrap" style="width: 80vw">
                            <v-card class="flex-grow-1" v-for="(item) in rankArray" :key="item.title+'Elist'">
                                <v-card-title class="text-caption">{{ item.title }}</v-card-title>
                                <v-card-actions class="text-body-1">
                                    <v-tooltip bottom>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn
                                            v-bind="attrs"
                                            v-on="on"
                                            color="primary"
                                            @click='download(csvConvert(item.data), item.title)'>
                                            點擊下載
                                            </v-btn>
                                        </template>
                                        <span>請注意，附檔名必須是.csv，若存檔時系統漏加，請自行補上</span>
                                    </v-tooltip>
                                </v-card-actions>
                            </v-card>
                        </v-sheet>
                  </v-tab-item>
              </v-tabs-items>
          </v-card-text>
      </v-card>
  </v-app>
</template>

<style>
    div.chartArea {
        width: 80vw;
        height: 500px;
    }
    div.pieArea {
        width: 20vw;
        height: 500px;
    }
</style>
<script>
import moment from 'moment'
import { randomColor } from 'randomcolor'
import PieChart from './modules/PieChart'
import LineChart from './modules/LineChart'
import * as Papa from 'papaparse'
import WebWorker from 'workerize-loader!./calcWorker'

import '@fortawesome/fontawesome-free/css/all.css';

export default {
    name: 'dataStatstic',
    components: {
        LineChart,
        PieChart
    },
    data() {
        return {
            calcCompleted: false,
            loadW: false,
            calcStatus: "啟動統計模組...",
            otherCount: 10,
            calcDone: true,
            step: 1,
            tab: 0,
            rawData: new Array(),
            startDate: '',
            endDate: '',
            itemcolumn: 0,
            itemcolumnname: "",
            datecolumn: 0,
            datacolumn: -1,
            datacolumnname: "",
            dataAppend: false,
            dateFormat: "YYYY-MM-DD HH:mm:ss",
            nameRegex: ".*",
            rawresult: new Array(),
            columns: new Array(),
            daterange: new Array(),
            sumArray: new Array(),
            valueArray: new Array(),
            labelArray: new Array(),
            filterFunction: 'return x',
            spanValue: 1,
            spanUnit: "months",
            spanUnitArr: [
                {
                    name: "年",
                    value: "years"
                },
                {
                    name: "月",
                    value: "months"
                },
                {
                    name: "日",
                    value: "days"
                }
            ],
            monthReset: true,
            rankArray: new Array(),
            errorList: new Array(),
            qerrList: new Array(),
            completed: false,
            qcompleted: false,
            barOptions: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        }
    },
    computed: {
        spanWord: function () {
            let spanObj = this.spanUnitArr.filter((item) => item.value === this.spanUnit);
            return spanObj[0].name;
        },
        monthControl: function() {
            return this.spanUnit === 'days';
        },
        lineData: function () {
            let bgColor = this.randomColors(1, 0.3);
            let borderColor = this.randomColors(1, 1);
            let bgsColor = this.randomColors(1, 0.3);
            let bordersColor = this.randomColors(1, 1);
            let datasets = [{
                label: '逐月次數',
                data: this.sumArray,
                backgroundColor: bgColor,
                borderColor: borderColor,
                fill: false,
                borderWidth: 1
            },
            {
                label: '逐月資料',
                data: this.valueArray,
                backgroundColor: bgsColor,
                borderColor: bordersColor,
                fill: false,
                borderWidth: 1
            }];
            let labels = this.labelArray;
            return {
                labels: labels,
                datasets: datasets
            };
        },
    },
    watch: {
    },
    methods: {
        topnBuildup: function(dataItem) {
            let count = 0;
            let othersum = 0;
            let otherdata = 0;
            let oriobj = this;
            let returnObj = {
                title: dataItem.title,
                labelArray: [],
                dataArray: [],
                data: []
            }
            dataItem.data.forEach((item) => {
                if(count < oriobj.otherCount) {
                    returnObj.labelArray.push(item.itemname);
                    returnObj.dataArray.push(item.itemvalue);
                    returnObj.data.push({
                        itemname: item.itemname,
                        itemvalue: item.itemvalue,
                        itemdata: item.itemdata
                    });
                } else {
                    othersum += parseInt(item.itemvalue, 10);
                    otherdata += parseInt(item.itemdata, 10);
                }
                count++;
            });
            returnObj.labelArray.push("其他");
            returnObj.dataArray.push(otherdata);
            returnObj.data.push({
                itemname: "其他",
                itemvalue: othersum,
                itemdata: otherdata
            });
            return returnObj;
        },
        dataSumup: function(data) {
            let datasumup = 0;
            data.forEach((item) => {
                datasumup += item.itemdata;
            });
            return datasumup;
        },
        createPie: function(dataItem) {
            let bgColor = this.randomColors(dataItem.dataArray.length, 1);
            let borderColor = this.randomColors(dataItem.dataArray.length, 0.5);
            return {
                datasets: [{
                    label: dataItem.title,
                    data: dataItem.dataArray,
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    fill: false,
                    borderWidth: 1
                }],
                labels: dataItem.labelArray
            };            
        },
        readColumn: function(file) {
            var obj = this;
            Papa.parse(file, {
                complete: function(result) {
                    obj.rawresult = result.data;
                    var i=0;
                    result.data[0].forEach(element => {
                        obj.columns.push({
                            text:element,
                            value: i
                        });
                        i++;
                    });
                }
            });
        },
        randomColors: function (n, alpha) {
            let color = randomColor({
                hue: 'light',
                count: n,
                format: 'rgba',
                alpha: alpha
            });
            return color;
        },
        readRange: function() {
            let count = 0;
            this.rawData = new Array();
            let oriobj = this;
            this.datacolumnname = this.dataAppend ? this.columns[this.datacolumn].text : "";
            this.itemcolumnname = this.columns[this.itemcolumn].text;
            let nameFilter = new RegExp(this.nameRegex);
            this.rawresult.forEach((item) => {
                count++;
                if(count > 1) {
                    if(item[0] !== '') {
                        if(nameFilter.test(item[oriobj.itemcolumn])) {
                            oriobj.rawData.push({
                                name: item[oriobj.itemcolumn],
                                data: oriobj.datacolumn == -1 ? "" : item[oriobj.datacolumn],
                                date: moment(item[oriobj.datecolumn], oriobj.dateFormat).unix(),
                                key: count
                            });
                        }
                    }
                }
            });
            this.rawData.sort(function(a, b) {
                return a.date - b.date;
            });
            this.startDate = moment.unix(this.rawData[0].date).format("YYYY-MM-DD");
            this.endDate = moment.unix(this.rawData[this.rawData.length - 1].date).format("YYYY-MM-DD");
            this.daterange = [this.startDate, this.endDate];
            this.step = 3;
        },
        calcResult: async function() {
            let oriobj = this;
            this.calcDone = false;
            let instance = WebWorker();
            instance.onmessage = (event) => {
                if(typeof event.data === 'string') {
                    if(event.data.includes("msg")) {
                        let msg = event.data.replace('msg', '');
                        oriobj.calcStatus = msg;
                        if(msg === '統計結束！') {
                            setTimeout(() => {
                                oriobj.calcCompleted = true;
                                oriobj.loadW = false;
                             }, 1000);
                        }
                    }
                }
            }
            this.loadW = true;
            let result = await instance.calcResult(this.rawData,{
                filterFunction: this.filterFunction,
                spanValue: this.spanValue,
                spanUnit: this.spanUnit,
                startDate: this.startDate,
                endDate: this.endDate,
                monthControl: this.monthControl,
                monthReset: this.monthReset,
                otherCount: this.otherCount
            });
            this.rankArray = result.rankArray;
            this.sumArray = result.sumArray;
            this.valueArray = result.valueArray;
            this.labelArray = result.labelArray;
            this.calcDone = result.calcDone;
        },
        download: function(content, title) {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + "\ufeff"+ encodeURIComponent(content));
            element.setAttribute('download', title + ".csv");
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            this.downloadAlert = "請注意，ISBN欄位在Excel中可能會被表現為科學記號，請手動在Excel中將該欄位改成「數字」，並去除小數點即可";
        },
        csvConvert: function(data) {
            let csvOutput = "";
            data.forEach((item) => {
                csvOutput += "\""+item.itemname+"\","+item.itemvalue+","+item.itemdata+"\n";
            });
            return csvOutput;
        }
    },
    mounted() {
    }
}
</script>