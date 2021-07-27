import data from './cstimer.js';

let timerData = cleanData(data);
let times = [];
for (let key in timerData) {
    times.push(timerData[key].times)
}
let flatTimes = times.flat()
    .filter(d => d.date.getFullYear() > 2019);
let nest = d3.nest()
    .key(d => d.date.getFullYear())
    .key(d => d.date.getMonth())
    .key(d => d.date.getDate())
    .key(d => d.date.getHours())
    .key(d => d.type)
    //.rollup(v => v.length)
    .entries(flatTimes);

let timeValues = nest.map(year => {
    return year.values.map(month => {
        return month.values.map(day => {
            return day.values.map(hour => {
                return hour.values.map(type => {
                    let minTime = d3.min(type.values, d => d.time.value);
                    let minTimeHour = d3.min(day.values, 
                        d => d3.min(d.values, 
                            f => d3.min(f.values, k => k.time.value)
                        )
                    );
                    return {
                        date: new Date(year.key, month.key, day.key, hour.key),
                        type: type.key,
                        value: type.values.length,
                        values: type.values,
                        minTime: minTime,
                        isMinTime: minTime === minTimeHour
                    };
                })
            })
        })
    })
})

let hourValues = timeValues.flat().flat().flat().flat();

let margin = { top: 20, right: 50, bottom: 20, left: 40},
    width = 900 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;
let svg = d3.select('#chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.left)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

let x = d3.scaleTime()
    .range([0,width])
    .domain(d3.extent(flatTimes, d => d.date));

svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

let y = d3.scaleLinear()
    .range([height,0])
    .domain([6, 20]);

svg.append('g')
    .call(d3.axisLeft(y));

let color = d3.scaleOrdinal()
    .range(['salmon', 'steelblue', 'purple', 'limegreen'])
    .domain(hourValues.map(d => d.type));

let r = d3.scaleLinear()
    .range([5,20])
    .domain(d3.extent(hourValues, d => d.value));
let rValues = [...new Set(hourValues.map(d => d.value))];
let rQuantiles = [
    d3.quantile(rValues, 0),
    d3.quantile(rValues, .5),
    d3.quantile(rValues, 1)
];


// type legend
let legend = svg.append('g')
    .attr('transform', `translate(${width - 200}, 0)`)
    .selectAll('g')
    .data(color.domain())
    .join('g');
legend.append('text')
    .text(d => d)
    .attr('x', (d,i) => i * 30)
    .attr('fill', d => color(d));

let circleLegend = svg.append('g')
    .attr('class', 'circle-legend')
    .attr('transform', `translate(${width - 140}, 50)`)
    .selectAll('g.circle')
    .data(rQuantiles)
    .join('g')
    .attr('class', 'circle');
circleLegend.append('circle')
    .attr('cy', (d,i) => -r(d) + i)
    .attr('cx', (d,i) => 0)
    .attr('r', (d,i) => r(d))
    .attr('fill', 'none')
    .attr('stroke', 'black');
circleLegend.append('text')
    .text(d => d)
    .attr('x', 0)
    .attr('y', (d,i) => -r(d)*2 - 1)
    .attr('text-anchor', 'middle')
    .attr('font-size', 8);


svg.selectAll('circle.data')
    .data(hourValues)
    .join('circle')
    .attr('class', 'data')
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.date.getHours()))
    .attr('r', d => 
        r(d.value)
    )
    .attr('fill', d => color(d.type))
    .attr('stroke', d => d.isMinTime ? 'black' : 'transparent')
    .attr('fill-opacity', 0.5);

// // lines y'all
// let lines = [];
// let index = 4;
// for (let key of color.domain()) {
//     let values = hourValues
//             .filter(d => d.type === key)
//             .sort((a,b) => a.date - b.date),
//         scale = d3.scaleLinear()
//             .range([height * (index/4),height * ((index - 1)/4)])
//             .domain([0, d3.max(values, d => d.minTime)]),
//         line = d3.line()
//             .x(d => x(d.date))
//             .y(d => scale(d.minTime));
//     index--;
//     let lineObj = { key, values, scale, line };
//     lines.push(lineObj);
// }

// let lineGs = svg.selectAll('g.lines')
//     .data(lines)
//     .join('g')
//     .attr('class', 'lines')
//     .attr('fill', 'none')
//     .attr('stroke', d => color(d.key))
//     .attr('stroke-width', 2);
// lineGs.append('path')
//     .attr('d', d => d.line(d.values));
// lineGs.append('g')
//     .attr('transform', d => `translate(${width + 5}, ${d.scale(d3.mean(d.values, f => f.minTime))})`)
//     .append('text')
//     .attr('stroke-width', 1)
//     .attr('font-size', 10)
//     .text(d => convertToMinSec(d3.mean(d.values, f => f.minTime)).toString())
// lineGs.append('g')
//     .attr('transform', d => `translate(${width + 5}, ${d.scale(d3.min(d.values, f => f.minTime))})`)
//     .append('text')
//     .attr('stroke-width', 1)
//     .attr('font-size', 10)
//     .text(d => convertToMinSec(d3.min(d.values, f => f.minTime)).toString())
// lineGs.append('g')
//     .attr('transform', d => `translate(${width + 5}, ${d.scale(d3.max(d.values, f => f.minTime))})`)
//     .append('text')
//     .attr('stroke-width', 1)
//     .attr('font-size', 10)
//     .text(d => convertToMinSec(d3.max(d.values, f => f.minTime)).toString())

        
// functions

function cleanData(d) {
    // loop through sessions
    for (let key in d) {
        // loop through times
        d[key].times = d[key].times.map(time => {
            let timeObj = {
                time: convertToMinSec(time[0][1]),
                scramble: time[1],
                date: new Date(time[3] * 1000),
                type: d[key].type
            }
            return timeObj;
        })
    }
    return d;
}


function convertToMinSec(time) {
    return {
        value: time,
        toString: function() {
            let minutes = this.value / 60000;
            let seconds = (minutes % 1) * 60;
            let milliseconds = seconds % 1;
            let returnStr = '';
            if (Math.floor(minutes) > 0) {
                returnStr += `${Math.floor(minutes)}:`;
            }
            returnStr += `${Math.floor(seconds) < 10 ? '0' + Math.floor(seconds) : Math.floor(seconds)}.${milliseconds.toFixed(3) * 1000}`
            return returnStr;
        }
    }
}