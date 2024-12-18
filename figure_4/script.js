// Set dimensions and margins of the graph
const margin = { top: 30, right: 50, bottom: 50, left: 70 },
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Append the SVG object to the div
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Load the CSV data
d3.csv("../dataset/population-by-age-group.csv").then(data => {

    // Filter data for "World" only
    const worldData = data.filter(d => d.Entity === "World");

    // Format the data
    worldData.forEach(d => {
        d.Year = +d.Year;
        d["65+"] = +d["Population - Sex: all - Age: 65+ - Variant: estimates"];
        d["25-64"] = +d["Population - Sex: all - Age: 25-64 - Variant: estimates"];
        d["15-24"] = +d["Population - Sex: all - Age: 15-24 - Variant: estimates"];
        d["5-14"] = +d["Population - Sex: all - Age: 5-14 - Variant: estimates"];
        d["0-4"] = +d["Population - Sex: all - Age: 0-4 - Variant: estimates"];
    });

    // List of groups (age groups)
    const groups = ["65+", "25-64", "15-24", "5-14", "0-4"];

    // Stack the data
    const stackedData = d3.stack()
        .keys(groups)
        (worldData);

    // Add X axis
    const x = d3.scaleLinear()
        .domain(d3.extent(worldData, d => d.Year))
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Define color palette
    const color = d3.scaleOrdinal()
        .domain(groups)
        .range(["#a65628", "#377eb8", "#4daf4a", "#ff7f00", "#984ea3"]);

    // Add area
    svg.selectAll("mylayers")
        .data(stackedData)
        .enter()
        .append("path")
        .style("fill", d => color(d.key))
        .attr("d", d3.area()
            .x(d => x(d.data.Year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
        );

    // Add legend
    const legend = svg.selectAll(".legend")
        .data(groups)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(10,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(d => d);
});
