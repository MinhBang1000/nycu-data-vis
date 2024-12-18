// Set dimensions for the responsive chart
const margin = { top: 30, right: 50, bottom: 50, left: 70 };
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG with responsive attributes
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
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

    // Add Y axis with formatted ticks (only tick numbers, no axis line)
    const y = d3.scaleLinear()
        .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
        .range([height, 0]);

    // Create Y-axis without the vertical line
    const yAxis = d3.axisLeft(y)
        .ticks(10)
        .tickFormat(d => {
            if (d >= 1e9) return `${d / 1e9} billion`; // Format as billions
            if (d >= 1e6) return `${d / 1e6} million`; // Optional: Format as millions
            return d; // Default formatting
        });

    // Append tick numbers only
    const yAxisGroup = svg.append("g")
        .call(yAxis);

    // Remove the vertical Y-axis line
    yAxisGroup.select(".domain").remove();

    // Add horizontal gridlines with slight blur
    yAxisGroup.selectAll(".tick line")
        .attr("x1", 0)
        .attr("x2", width) // Span the entire chart width
        .style("stroke", "grey")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "3,3") // Dashed line
        .style("opacity", 0.4); // Slight blur effect with opacity

    // Keep only the tick numbers
    yAxisGroup.selectAll(".tick text")
        .style("font-size", "12px")
        .style("fill", "black");



    // Define color palette
    const color = d3.scaleOrdinal()
        .domain(groups)
        .range(["#a65628", "#377eb8", "#4daf4a", "#ff7f00", "#984ea3"]);

    // Add the stacked areas
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

    // Dynamically position labels near the areas for the last year (2023)
    const lastYearData = worldData[worldData.length - 1];

    svg.selectAll(".label")
        .data(groups)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", width + 10) // Position slightly to the right
        .attr("y", (group) => {
            // Calculate the midpoint of each area for the last year
            const groupIndex = groups.indexOf(group);
            const y0 = y(stackedData[groupIndex][stackedData[groupIndex].length - 1][0]);
            const y1 = y(stackedData[groupIndex][stackedData[groupIndex].length - 1][1]);
            return (y0 + y1) / 2; // Midpoint
        })
        .text(d => d)
        .style("fill", d => color(d))
        .style("font-size", "12px")
        .style("alignment-baseline", "middle");
});
