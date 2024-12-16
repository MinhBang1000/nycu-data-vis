// Set dimensions and margins of the graph
const margin = { top: 50, right: 80, bottom: 50, left: 60 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Append the SVG object to the div with id 'chart'
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the CSV file
d3.csv("../dataset/fertility-rate-with-projections.csv").then(data => {
    // Parse the data
    data.forEach(d => {
        d.Year = +d.Year;
        d.FertilityEstimate = +d["Fertility rate - Sex: all - Age: all - Variant: estimates"];
        d.FertilityProjection = +d["Fertility rate - Sex: all - Age: all - Variant: medium"];
    });

    // Group the data by entity
    const regions = d3.group(data, d => d.Entity);

    // Create scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(d.FertilityEstimate, d.FertilityProjection))])
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(10));

    // Add Y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Draw lines for each region
    regions.forEach((values, key) => {
        const lineEstimate = d3.line()
            .x(d => x(d.Year))
            .y(d => y(d.FertilityEstimate));

        const lineProjection = d3.line()
            .x(d => x(d.Year))
            .y(d => y(d.FertilityProjection));

        // Draw estimates (solid line)
        svg.append("path")
            .datum(values.filter(d => !isNaN(d.FertilityEstimate)))
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 1.5)
            .attr("d", lineEstimate);

        // Draw projections (dashed line)
        // svg.append("path")
        //     .datum(values.filter(d => !isNaN(d.FertilityProjection)))
        //     .attr("fill", "none")
        //     .attr("stroke", color(key))
        //     .attr("stroke-width", 1.5)
        //     .style("stroke-dasharray", ("3,3"))
        //     .attr("d", lineProjection);
    });

    // Add a legend
    const legend = svg.selectAll(".legend")
        .data([...regions.keys()])
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legend.append("rect")
        .attr("x", width - 20)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", d => color(d));

    legend.append("text")
        .attr("x", width - 30)
        .attr("y", 5)
        .attr("dy", "0.35em")
        .style("text-anchor", "end")
        .text(d => d);
});
