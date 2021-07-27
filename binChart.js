d3.thresholdsTime = n => (data, min, max) => d3.scaleTime().domain([min, max]).ticks(n)

export default class BinChart {
    constructor(datas = values, height, width, numBins = 5, xScale = 'scaleLinear', svgElem) {
        this.data = datas;
        this.numBins = numBins;
        this.xScale = xScale;
        this.svg = svgElem.append('g');
        if (height) {
            this.height = height;
        }
        if (width) {
            this.width = width
        }
    }
    monthDiff(d1, d2) {
        var months;
        months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        return months <= 0 ? 0 : months;
    }
    toLocalDate(date) {
        return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`;
    }
    toLocalDateMonthYear(date) {
        return `${date.getMonth()}/${date.getFullYear()}`;
    }
    get x() {
        return d3[this.xScale]()
            .range([0, this.width])
            .domain(d3.extent(this.data, d => d.date))
    }
    get y() { 
        let extent = d3.extent(this.data, d => d.time.value);
        return d3.scaleLinear()
            .range([this.height,0])
            .domain([extent[0] - 5000, extent[1] + 10000])
    }
    get bin() {
        return d3.bin()
        .value(d => d.date)
        .domain(d3.extent(this.data, d => d.date))
        .thresholds(this.numBins);
    }
    get binColor() {
        let colors = ["black"]
            .concat(d3.schemeCategory10)
            .concat(d3.schemePaired)
            .concat(d3.schemePastel1)
            .concat(d3.schemePastel2)
        return d3.scaleThreshold()
        .domain(this.buckets.map(d => d.x0))
        .range(colors);
    }
    get buckets() {
        return this.bin(this.data)
        .map(bin => {
            bin.sort((a, b) => a.time.value - b.time.value);
            const values = bin.map(d => d.time.value);
            const min = values[0];
            const max = values[values.length - 1];
            const q1 = d3.quantile(values, 0.25);
            const q2 = d3.quantile(values, 0.50);
            const q3 = d3.quantile(values, 0.75);
            const iqr = q3 - q1; // interquartile range
            const r0 = Math.max(min, q1 - iqr * 1.5);
            const r1 = Math.min(max, q3 + iqr * 1.5);
            bin.quartiles = [q1, q2, q3];
            bin.range = [r0, r1];
            bin.outliers = bin.filter(v => v.time.value < r0 || v.time.value > r1); // TODO
            return bin;
        });
    }
}