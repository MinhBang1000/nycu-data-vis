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

// Function to update the chart based on year
function updateChart(data, year) {
    const filteredData = data.filter(d => d.Year === year);

    const x = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.deathRate)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.birthRate)])
        .range([height, 0]);

    const sizeScale = d3.scaleSqrt()
        .domain(d3.extent(filteredData, d => d.population))
        .range([4, 50]);

    const color = d3.scaleOrdinal()
        .domain(["Africa", "Asia", "Europe", "North America", "Oceania", "South America"])
        .range(["#FF9AA2", "#FFB347", "#B5EAD7", "#C7CEEA", "#FFDAC1", "#9DE0AD"]);

    // Update axes
    g.selectAll(".x-axis").remove();
    g.selectAll(".y-axis").remove();

    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(5));

    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5));

    // Bind data and update bubbles
    const bubbles = g.selectAll(".bubbles")
        .data(filteredData, d => d.Entity); // Use key function for unique countries

    // ENTER new bubbles
    const bubblesEnter = bubbles.enter()
        .append("circle")
        .attr("class", "bubbles")
        .attr("cx", d => x(d.deathRate))
        .attr("cy", d => y(d.birthRate))
        .attr("r", 0) // Start with 0 radius for transition
        .style("fill", d => color(d["World regions according to OWID"]))
        .style("opacity", 0.7);

    // MERGE (ENTER + UPDATE)
    bubblesEnter.merge(bubbles)
        .transition()
        .duration(500)
        .attr("cx", d => x(d.deathRate))
        .attr("cy", d => y(d.birthRate))
        .attr("r", d => sizeScale(d.population));

    // EXIT old bubbles
    bubbles.exit()
        .transition()
        .duration(500)
        .attr("r", 0) // Shrink radius to 0
        .remove();

    // Add tooltip functionality
    g.selectAll(".bubbles")
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`
                    <strong>Country:</strong> ${d.Entity}<br>
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
}


// Load data and initialize slider
d3.csv("../dataset/birth-rate-vs-death-rate.csv").then(data => {
    data.forEach(d => {
        d.birthRate = +d["Birth rate - Sex: all - Age: all - Variant: estimates"];
        d.deathRate = +d["Death rate - Sex: all - Age: all - Variant: estimates"];
        d.population = +d["Population - Sex: all - Age: all - Variant: estimates"];
        d.Year = d.Year; // Ensure Year is a string for matching slider input
    });

    const yearSlider = d3.select("#year-slider");
    const yearDisplay = d3.select("#year-display");

    // Initialize chart with default year (slider's initial value)
    let currentYear = yearSlider.property("value");
    updateChart(data, currentYear);

    // Update chart when slider value changes
    yearSlider.on("input", function () {
        currentYear = this.value;
        yearDisplay.text(currentYear);
        updateChart(data, currentYear);
    });
});
