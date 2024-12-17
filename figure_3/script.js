// Set margins and dimensions relative to the viewBox
const margin = { top: 50, right: 80, bottom: 50, left: 60 };
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet") // Maintain aspect ratio
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none");

// Add points container
const pointsGroup = svg.append("g").attr("class", "points");

// Load the CSV file
d3.csv("../dataset/fertility-rate-with-projections.csv").then(data => {
    // Parse the data
    data.forEach(d => {
        d.Year = +d.Year;
        // Use 'estimates' column for historical data; 'medium' column for future data
        d.FertilityEstimate = d["Fertility rate - Sex: all - Age: all - Variant: estimates"]
            ? +d["Fertility rate - Sex: all - Age: all - Variant: estimates"]
            : +d["Fertility rate - Sex: all - Age: all - Variant: medium"];
    });

    const regions = d3.group(data, d => d.Entity);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.FertilityEstimate)])
        .range([height, 0]);

    // Add axes
    const formatYear = d3.format("d"); // Removes commas and formats as integers
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(formatYear));
    svg.append("g").call(d3.axisLeft(y));

    const legend = svg.append("g")
        .attr("transform", `translate(${width}, 0)`); // Adjust legend position

    let legendYOffset = 0; // Starting Y offset

    const simplifyKey = (key) => {
        const keyMap = {
            "Latin America and the Caribbean (UN)": "Latin America",
            "Northern America (UN)": "N. America"
        };
        return keyMap[key] || key.replace(/\s*\(.*?\)/g, "").trim();
    };

    // Add lines and attach IDs for easy selection
    const lines = {};
    regions.forEach((values, key) => {
        const pastData = values.filter(d => d.Year <= 2023);
        const futureData = values.filter(d => d.Year > 2023);

        const line = svg.append("path")
            .datum(pastData)
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 1.5)
            .attr("class", "line")
            .attr("id", `line-${key.replace(/[^\w-]/g, "")}`) // Remove all non-alphanumeric characters except hyphens

            .attr("d", d3.line()
                .x(d => x(d.Year))
                .y(d => y(d.FertilityEstimate)));

        svg.append("path")
            .datum(futureData)
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4 4") // Dashed line pattern
            .attr("class", "line")
            .attr("id", `line-${key.replace(/[^\w-]/g, "")}`) // Remove all non-alphanumeric characters except hyphens

            .attr("d", d3.line()
                .x(d => x(d.Year))
                .y(d => y(d.FertilityEstimate)));

        lines[key] = line; // Save line reference
    });

    // Build interactive legend
    regions.forEach((_, key) => {
        const simplifiedKey = simplifyKey(key);

        // Legend rectangle
        legend.append("rect")
            .attr("x", 0)
            .attr("y", legendYOffset)
            .attr("width", 12)
            .attr("height", 12)
            .style("fill", color(key))
            .on("mouseenter", () => highlightLine(key))
            .on("mouseleave", resetLines);

        // Legend text
        legend.append("text")
            .attr("x", 20)
            .attr("y", legendYOffset + 10)
            .style("font-size", "10px")
            .style("text-anchor", "start")
            .text(simplifiedKey)
            .on("mouseenter", () => highlightLine(key))
            .on("mouseleave", resetLines);

        legendYOffset += 25; // Increase spacing between legend items
    });

    // Function to highlight the corresponding line
    function highlightLine(key) {
        svg.selectAll(".line").style("opacity", 0.2); // Dim all lines
        svg.selectAll(`#line-${key.replace(/[^\w-]/g, "")}`).style("opacity", 1).style("stroke-width", 2.5);
    }    

    // Function to reset all lines
    function resetLines() {
        svg.selectAll(".line").style("opacity", 1).style("stroke-width", 1.5);
    }


    // Vertical line and points for hover
    const verticalLine = svg.append("line")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1)
        .attr("y1", 0).attr("y2", height)
        .style("display", "none");

    svg.append("rect")
        .attr("width", width).attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", mousemove)
        .on("mouseout", () => {
            tooltip.style("display", "none");
            verticalLine.style("display", "none");
            pointsGroup.selectAll("circle").remove();
        });

    function mousemove(event) {
        const [mouseX] = d3.pointer(event);
        const year = Math.round(x.invert(mouseX));

        verticalLine.style("display", "block")
            .attr("x1", x(year)).attr("x2", x(year));

        tooltip.style("display", "block")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);

        pointsGroup.selectAll("circle").remove();

        const tooltipValues = [];
        regions.forEach((values, key) => {
            const closest = values.find(d => d.Year === year);
            if (closest) {
                tooltipValues.push({ key, value: closest.FertilityEstimate });
                pointsGroup.append("circle")
                    .attr("cx", x(year))
                    .attr("cy", y(closest.FertilityEstimate))
                    .attr("r", 4)
                    .attr("fill", color(key));
            }
        });

        tooltip.html(`
            <div style="text-align: left;">
                <strong>${year}</strong><br>
                ${tooltipValues.map(d => `
                    <span style="color:${color(d.key)};">
                        ${d.key}: <strong>${d.value.toFixed(2)}</strong>
                    </span>`).join('<br>')}
            </div>
        `);
    }
});
