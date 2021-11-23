
function Chart(svg, data, height, width, margin, xFunc, yFunc) {
    this.data = data;
    this.g = svg.append('g')
        .attr('transform', `translate(0,0)`)
        .attr('class', 'time-chart'),
    this.margin = margin;
    this.height = height / 2 - margin.top;
    this.width = width;
    this.x = xFunc === null ? null : d3.scaleTime()
        .domain(d3.extent(this.data, xFunc))
        .range([0, this.width]);
    this.y = yFunc === null ? null : d3.scaleTime()
        .domain([d3.min(this.data, yFunc) - 3000, d3.max(this.data, yFunc)])
        .range([this.height, 0]);
    this.axis = function(third = undefined) {
        this.g.append('g')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(this.x));
        this.g.append('g')
            .attr('transform', `translate(${this.width},0)`)
            .call(d3.axisLeft(this.y).ticks(6).tickSize(this.width))
            .call(g => {
                g.select('path').remove();
                g.selectAll('.tick').select('line').attr('stroke-width', 0.3)
            });
        if (third) {
            this.g.append('g')
                .attr('transform', `translate(${this.width},0)`)
                .call(d3.axisRight(third).ticks(6))
        }
        return this;
    }
    return this;
};

export default Chart;