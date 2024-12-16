const margin = { top: 30, right: 40, bottom: 50, left: 60 };

// Append SVG with responsive properties
const svg = d3.select("#chart")
    .attr("viewBox", `0 0 800 600`) // Responsive scaling
    .attr("preserveAspectRatio", "xMidYMid meet"); // Maintains aspect ratio

const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

// Load Data
d3.csv("../dataset/birth-rate-vs-death-rate.csv").then(data => {
    // Filter dataset for a specific year (2023 as an example)
    const filteredData = data.filter(d => d.Year === "2023");

    // Parse and calculate rates
    filteredData.forEach(d => {
        d.birthRate = +d["Birth rate - Sex: all - Age: all - Variant: estimates"];
        d.deathRate = +d["Death rate - Sex: all - Age: all - Variant: estimates"];
        d.population = +d["Population - Sex: all - Age: all - Variant: estimates"];
        d.country = d.Entity;
    });

    // Scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.deathRate)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.birthRate)])
        .range([height, 0]);

    const sizeScale = d3.scaleSqrt()
        .domain([d3.min(filteredData, d => d.population), d3.max(filteredData, d => d.population)])
        .range([4, 50]); // Scale bubble size based on population

    const color = d3.scaleOrdinal()
        .domain(filteredData.map(d => d["World regions according to OWID"])) // Regions as domain
        .range(d3.schemeSet2);

    // Axes
    g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(5)); // Set X-axis ticks to 5

    g.append("g")
        .call(d3.axisLeft(y).ticks(5)); // Set Y-axis ticks to 5

    // Gray diagonal line
    g.append("line")
        .attr("x1", 0).attr("y1", height)
        .attr("x2", width).attr("y2", 0)
        .style("stroke", "gray")
        .style("stroke-dasharray", "5,5");

    // Bubbles
    g.selectAll(".bubbles")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("class", "bubbles")
        .attr("cx", d => x(d.deathRate))
        .attr("cy", d => y(d.birthRate))
        .attr("r", d => sizeScale(d.population)) // Scale bubble size by population
        .style("fill", d => color(d["World regions according to OWID"]))
        .style("opacity", 0.7)
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`
                    <strong>Country:</strong> ${d.country}<br>
                    <strong>Birth Rate:</strong> ${d.birthRate} per 1,000<br>
                    <strong>Death Rate:</strong> ${d.deathRate} per 1,000<br>
                    <strong>Population:</strong> ${d.population.toLocaleString()}
                `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mousemove", event => {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });
});
