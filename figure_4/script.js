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

// Function to format Y-axis values
function formatYAxis(d) {
    if (d >= 1e9) return `${d / 1e9} billion`;
    if (d >= 1e6) return `${d / 1e6} million`;
    if (d >= 1e3) return `${d / 1e3}k`;
    return d; // Default for smaller numbers
}

// Function to draw the chart based on filtered data
function updateChart(data, minYear, maxYear) {
    const filteredData = data.filter(d => d.Year >= minYear && d.Year <= maxYear);

    const groups = ["65+", "25-64", "15-24", "5-14", "0-4"];
    const stackedData = d3.stack().keys(groups)(filteredData);

    const x = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(groups)
        .range(["#a65628", "#377eb8", "#4daf4a", "#ff7f00", "#984ea3"]);

    svg.selectAll("*").remove(); // Clear the chart

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));

    // Add Y-axis gridlines with formatted ticks
    svg.append("g")
        .call(d3.axisLeft(y).ticks(10).tickSize(-width).tickFormat(formatYAxis))
        .selectAll(".domain").remove();

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

    // Add horizontal blur gridlines
    svg.selectAll(".tick line")
        .style("stroke", "grey")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.4);

    // Add labels dynamically for the last year
    svg.selectAll(".label")
        .data(groups)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", width + 5) // Place outside the chart
        .attr("y", (group, i) => {
            const groupIndex = groups.indexOf(group);
            const y0 = y(stackedData[groupIndex][stackedData[groupIndex].length - 1][0]);
            const y1 = y(stackedData[groupIndex][stackedData[groupIndex].length - 1][1]);
            return (y0 + y1) / 2; // Midpoint
        })
        .text(d => d)
        .style("fill", d => color(d))
        .style("font-size", "12px")
        .style("alignment-baseline", "middle");
}

// Load the CSV data
d3.csv("../dataset/population-by-age-group.csv").then(data => {
    const worldData = data.filter(d => d.Entity === "World");

    worldData.forEach(d => {
        d.Year = +d.Year;
        d["65+"] = +d["Population - Sex: all - Age: 65+ - Variant: estimates"];
        d["25-64"] = +d["Population - Sex: all - Age: 25-64 - Variant: estimates"];
        d["15-24"] = +d["Population - Sex: all - Age: 15-24 - Variant: estimates"];
        d["5-14"] = +d["Population - Sex: all - Age: 5-14 - Variant: estimates"];
        d["0-4"] = +d["Population - Sex: all - Age: 0-4 - Variant: estimates"];
    });

    const slider = document.getElementById("timeRange");
    const timeLabel = document.getElementById("timeLabel");

    let minYear = 1950;
    let maxYear = +slider.value;

    // Initial chart rendering
    updateChart(worldData, minYear, maxYear);

    // Update chart when the slider changes
    slider.addEventListener("input", (e) => {
        const newMaxYear = +e.target.value;
        if (newMaxYear - minYear >= 10) {
            maxYear = newMaxYear;
            timeLabel.textContent = `Year: ${minYear} - ${maxYear}`;
            updateChart(worldData, minYear, maxYear);
        } else {
            e.target.value = maxYear; // Prevent slider from going below 10 years
        }
    });
});
