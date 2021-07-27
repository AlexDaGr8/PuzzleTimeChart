import Canvas from './canvas.js';
import data from './cstimer.js';

class Chart extends Canvas {
    constructor (canvasId) {
        super(canvasId);
        this.data = this.cleanData(data);
        console.log(this.data);
        console.log(this.extent(this.data.session1.times, time => time.date))
        console.log(this.extent(this.data.session1.times, time => time.time.value))
        this.nestTimes = this.nest(this.data, ['times']);
    }

    cleanData(d) {
        // loop through sessions
        for (let key in d) {
            // loop through times
            d[key].times = d[key].times.map(time => {
                let timeObj = {
                    time: this.convertToMinSec(time[0][1]),
                    scramble: time[1],
                    date: new Date(time[3] * 1000),
                    type: d[key].type
                }
                return timeObj;
            })
        }
        return d;
    }
    
    convertToMinSec(time) {
        return {
            value: time,
            toString: function() {
                console.log(this.value);
                let minutes = this.value / 60000;
                let seconds = (minutes % 1) * 60;
                let milliseconds = seconds % 1;
                let returnStr = '';
                if (Math.floor(minutes) > 0) {
                    returnStr += `${Math.floor(minutes)}:`;
                }
                returnStr += `${Math.floor(seconds) < 9 ? '0' + Math.floor(seconds) : Math.floor(seconds)}.${milliseconds.toFixed(3) * 1000}`
                return returnStr;
            }
        }
    }

    extent(arr,func) {
        return [this.min(arr,func), this.max(arr,func)]
    }

    max(values,valueof) {
        let mappedValues = valueof !== undefined ? values.map(valueof) : values;
        let max;
        for (const m of mappedValues) {
          if (m !== undefined && (max < m || (max === undefined && m >= m))) {
            max = m;
          }
        }
        return max;
    }

    min(values,valueof) {
        let mappedValues = valueof !== undefined ? values.map(valueof) : values;
        let min;
        for (const m of mappedValues) {
            if (m !== undefined && (min > m || (min === undefined && m >= m))) {
            min = m;
            }
        }
        return min;
    }

    nest(values) {
        let arr = [];
        for (let vKey in values) {
            console.log(values[vKey])
            let m = values[vKey].times;
            arr.push(m);
        }
        let flatArr = arr.flat();
        let returnArr = [];
        for (let d of flatArr) {
            let date = d.date;
            if (returnArr.find(d => d.key === date.getFullYear()) === undefined) {
                let yearObj = {
                    key: date.getFullYear(),
                    values: [
                        { key: date.getMonth(), values: [date] }
                    ]
                }
                returnArr.push(yearObj);
            } else {
                let findYear = returnArr.find(d => d.key === date.getFullYear());
                if (findYear.values.find(y => y.key === date.getMonth()) === undefined) {
                    let monthObj = {
                        key: date.getMonth(),
                        values: [date]
                    }
                    findYear.values.push(monthObj);
                } else {
                    let findMonth = findYear.values.find(y => y.key === date.getMonth());
                    findMonth.values.push(date);
                }
            }
        }
        console.log('flatArr', flatArr);
        console.log('returnArr', returnArr);
    }

    mouseDown(e) {
        console.log('test', this.data);

    }
}

export default Chart;