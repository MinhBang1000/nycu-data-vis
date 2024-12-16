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

// Create a tooltip div
const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#ffffff")
    .style("border", "1px solid #ccc")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("display", "none");

// Load the CSV file
d3.csv("../dataset/fertility-rate-with-projections.csv").then(data => {
    // Parse the data
    data.forEach(d => {
        d.Year = +d.Year;
        d.FertilityEstimate = +d["Fertility rate - Sex: all - Age: all - Variant: estimates"];
    });

    // Group the data by entity
    const regions = d3.group(data, d => d.Entity);

    // Create scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.FertilityEstimate)])
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
    const lineData = [];
    regions.forEach((values, key) => {
        const line = d3.line()
            .x(d => x(d.Year))
            .y(d => y(d.FertilityEstimate));

        lineData.push({ key, values });

        svg.append("path")
            .datum(values.filter(d => !isNaN(d.FertilityEstimate)))
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 1.5)
            .attr("d", line);
    });

    // Vertical line for hover
    const verticalLine = svg.append("line")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1)
        .attr("y1", 0)
        .attr("y2", height)
        .style("display", "none");

    // Overlay rectangle for mouse events
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", mousemove)
        .on("mouseout", () => {
            verticalLine.style("display", "none");
            tooltip.style("display", "none");
        });

    function mousemove(event) {
        const [mouseX] = d3.pointer(event);
        const year = Math.round(x.invert(mouseX));

        const tooltipData = lineData.map(({ key, values }) => {
            const closest = values.find(d => d.Year === year);
            return { key, value: closest ? closest.FertilityEstimate : null };
        });

        // Update vertical line
        verticalLine.style("display", "block")
            .attr("x1", x(year))
            .attr("x2", x(year));

        // Update tooltip
        tooltip.style("display", "block")
            .html(`
                <strong>${year}</strong><br>
                ${tooltipData.map(d => `
                    <span style="color:${color(d.key)};">
                        ${d.key}: <strong>${d.value ? d.value.toFixed(2) : 'N/A'}</strong>
                    </span>
                `).join('<br>')}
            `)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
    }

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
