const margin = { top: 50, right: 80, bottom: 50, left: 60 };
const width = 700 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none");

const pointsGroup = svg.append("g").attr("class", "points");

const countrySelect = d3.select("#country-select");

d3.csv("../dataset/population-growth-rates.csv").then(data => {
    // Data Parsing
    data.forEach(d => {
        d.Year = +d.Year;
        d.Estimate = +d["Population growth rate - Sex: all - Age: all - Variant: estimates"] || null;
        d.Medium = +d["Population growth rate - Sex: all - Age: all - Variant: medium"] || null;
    });

    const countries = Array.from(new Set(data.map(d => d.Entity))).sort();
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Populate dropdown with countries
    countrySelect.selectAll("option")
        .data(countries)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Initial rendering
    updateChart(countries[0]);

    // Update chart when a country is selected
    countrySelect.on("change", () => {
        const selectedCountry = countrySelect.node().value;
        updateChart(selectedCountry);
    });

    function updateChart(country) {
        // Filter data for selected country
        const countryData = data.filter(d => d.Entity === country);
        const pastData = countryData.filter(d => d.Estimate !== null);
        const futureData = countryData.filter(d => d.Medium !== null);

        // Update axes scaling
        const x = d3.scaleLinear()
            .domain(d3.extent(countryData, d => d.Year))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([
                d3.min(countryData, d => Math.min(d.Estimate || 0, d.Medium || 0)),
                d3.max(countryData, d => Math.max(d.Estimate || 0, d.Medium || 0)) * 1.1
            ])
            .range([height, 0]);

        svg.selectAll("*").remove(); // Clear previous chart

        // X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        // Y Axis with Grid
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .tickFormat(d => `${d.toFixed(1)}%`)
                .tickSize(-width)
                .ticks(7))
            .selectAll("line")
            .attr("stroke", "#ddd");

        svg.selectAll(".grid .domain").remove();

        // Solid Line for Past Data
        svg.append("path")
            .datum(pastData)
            .attr("fill", "none")
            .attr("stroke", color(country))
            .attr("stroke-width", 1.5)
            .attr("class", "line")
            .attr("d", d3.line()
                .x(d => x(d.Year))
                .y(d => y(d.Estimate)));

        // Dashed Line for Future Data
        svg.append("path")
            .datum(futureData)
            .attr("fill", "none")
            .attr("stroke", color(country))
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4 4")
            .attr("class", "line")
            .attr("d", d3.line()
                .x(d => x(d.Year))
                .y(d => y(d.Medium)));

        // Tooltip
        const verticalLine = svg.append("line")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1)
            .attr("y1", 0).attr("y2", height)
            .style("display", "none");

        svg.append("rect")
            .attr("width", width).attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mousemove", event => mousemove(event, x, y, pastData, futureData, country))
            .on("mouseout", () => {
                tooltip.style("display", "none");
                verticalLine.style("display", "none");
                pointsGroup.selectAll("circle").remove();
            });

        function mousemove(event, x, y, pastData, futureData, country) {
            const [mouseX] = d3.pointer(event);
            const year = Math.round(x.invert(mouseX));

            verticalLine.style("display", "block")
                .attr("x1", x(year)).attr("x2", x(year));

            tooltip.style("display", "block")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);

            pointsGroup.selectAll("circle").remove();

            const closestPast = pastData.find(d => d.Year === year);
            const closestFuture = futureData.find(d => d.Year === year);

            const tooltipValues = [];
            if (closestPast) tooltipValues.push({ key: country, value: closestPast.Estimate });
            if (closestFuture) tooltipValues.push({ key: country, value: closestFuture.Medium });

            tooltip.html(`
                <div style="text-align: left;">
                    <strong>${year}</strong><br>
                    ${tooltipValues.map(d => `
                        <span style="color:${color(d.key)};">
                            ${d.key}: <strong>${d.value.toFixed(2)}%</strong>
                        </span>`).join('<br>')}
                </div>
            `);
        }
    }
});
