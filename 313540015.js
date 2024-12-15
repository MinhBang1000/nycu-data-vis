// initial setup
const svg = d3.select("svg")
    .attr("viewBox", "0 0 800 400") // Set the viewBox for scaling
    .attr("preserveAspectRatio", "xMidYMid meet"); // Maintain aspect ratio

const width = 800
const height = 400


const path = d3.geoPath(),
    data = new Map(),
    worldmap = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
    worldpopulation = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv",
    worldpopulationdesity = "./dataset/population-density.csv";

let centered, world;
const projection = d3.geoRobinson().
    scale(130).
    translate([300, 200]);

// Define color scale
// const colorScale = d3.scaleThreshold().
//     domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000]).
//     range(d3.schemeOrRd[7]);
const colorScale = d3.scaleThreshold()
    .domain([1, 10, 100, 1000, 5000])
    .range([
        "#a8ddb5", // Lightest blue (lowest density)
        "#7bccc4",
        "#4eb3d3",
        "#2b8cbe",
        "#0868ac",
        "#084081" // Deepest blue (highest density)
    ]);

// add tooltip
const tooltip = d3.select("body").append("div").
    attr("class", "tooltip").
    style("opacity", 0);

// Configuration
year = 2023



// Reference the slider and year display elements
const slider = document.getElementById('year-slider');
const currentYearDisplay = document.getElementById('current-year');

// Event listener for the slider
slider.addEventListener('input', function () {
    year = +slider.value; // Update the global year variable
    currentYearDisplay.textContent = year; // Update the displayed year
    updateMapForYear(year); // Call a function to update the map
});

// Function to update the map based on the selected year
function updateMapForYear(selectedYear) {
    // Load and filter the data for the selected year
    d3.csv(worldpopulationdesity).then(rawData => {
        data.clear(); // Clear the existing data map
        const filteredData = rawData.filter(d => d["Year"] === String(selectedYear));
        filteredData.forEach(d => {
            data.set(d["Code"], +d["Population density"]);
        });

        // Update the map colors based on the new data
        world.selectAll("path")
            .transition()
            .duration(500) // Smooth transition for the color change
            .attr("fill", function (d) {
                d.total = data.get(d.id) || 0; // Update total for each country
                return colorScale(d.total);
            });
    }).catch(error => {
        console.error("Error updating data for year:", error);
    });
}

// Add clickable background
svg.append("rect").
    attr("class", "background").
    on("click", click);

// ----------------------------
// Start of Choropleth drawing
// ----------------------------
let tooltipcontent = (countryName, populationDensity, year) => `
    <div style="font-family: Arial, sans-serif;">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #007BFF;">
            ${countryName}
        </div>
        <div style="font-size: 14px; margin-bottom: 6px;">
            <span style="font-weight: 600;">Population Density:</span> 
            <span>${populationDensity} people/km²</span>
        </div>
        <div style="font-size: 14px; margin-bottom: 6px;">
            <span style="font-weight: 600;">Year:</span> 
            <span>${year}</span>
        </div>
        <div id="chart" style="margin-top: 10px; width: 100%; height: 80px; background: linear-gradient(90deg, #eef2f3, #ffffff); border: 1px dashed #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center;">
            <span style="font-style: italic; font-size: 12px; color: #999;">Chart Placeholder</span>
        </div>
    </div>
`;

function ready(error, topo) {
    let mouseOver = function (d) {
        // Highlight the hovered country with a thicker border and tooltip display
        d3.select(this)
            .transition()
            .duration(200)
            .style("stroke", "black")
            .style("stroke-width", 2);

        country = d["toElement"]["__data__"];
        tooltip.style("left", event.pageX + 15 + "px")
            .style("top", event.pageY - 28 + "px")
            .transition()
            .duration(300)
            .style("opacity", 1);

        tooltip.html(tooltipcontent(country.properties.name, Math.round(country.total * 100) / 100, year))
    };

    let mouseLeave = function () {
        // Reset the border and hide the tooltip
        d3.select(this)
            .transition()
            .duration(200)
            .style("stroke", "transparent")
            .style("stroke-width", 1);

        tooltip.transition()
            .duration(300)
            .style("opacity", 0);
    };

    // Draw the map
    world = svg.append("g")
        .attr("class", "world")

    world.selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(projection)) // Draw each country
        .attr("data-name", function (d) {
            return d.properties.name; // Retrieve the country name
        })
        .attr("fill", function (d) {
            d.total = data.get(d.id) || 0;
            return colorScale(d.total); // Set the color of each country
        })
        .style("stroke", "transparent") // Initial stroke style
        .attr("class", function (d) {
            return "Country";
        })
        .attr("id", function (d) {
            return d.id;
        })
        .style("opacity", 1)
        .on("mouseover", mouseOver) // Hover interaction
        .on("mouseleave", mouseLeave) // Reset interaction
        .on("click", function (event, d) {
            click(d); // Zoom functionality
        })
        .transition() // Smooth rendering for each country
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .style("opacity", 1);
}


// Zoom functionality
function click(d) {
    var x, y, k;

    if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = -(centroid[0] * 6);
        y = centroid[1] * 6;
        k = 3;
        centered = d;
    } else {
        x = 0;
        y = 0;
        k = 1;
        centered = null;
    }

    if (!isNaN(x) && !isNaN(y)) {
        world.selectAll("path").
            classed("active", centered && function (d) { return d === centered; });

        world.transition().
            duration(300).
            attr("transform", "translate(" + x + "," + y + ") scale(" + k + ")");
    }

}

// Color bars

function createLegendBar() {
    const legendData = [
        { color: "#a8ddb5", label: "1-10", range: [1, 10] },
        { color: "#7bccc4", label: "10-100", range: [10, 100] },
        { color: "#4eb3d3", label: "100-1k", range: [100, 1000] },
        { color: "#2b8cbe", label: "1k-5k", range: [1000, 5000] },
        { color: "#0868ac", label: ">5k", range: [5000, Infinity] },
    ];

    // const legendData = [
    //     { color: "#a8ddb5", label: "1-10 people/km²", range: [1, 10] },
    //     { color: "#7bccc4", label: "10-100 people/km²", range: [10, 100] },
    //     { color: "#4eb3d3", label: "100-1000 people/km²", range: [100, 1000] },
    //     { color: "#2b8cbe", label: "1000-5000 people/km²", range: [1000, 5000] },
    //     { color: "#0868ac", label: ">5000 people/km²", range: [5000, Infinity] },
    // ];

    const container = d3.select(".color-bar-container");

    const legendWidth = 400;
    const legendHeight = 50;
    const blockWidth = legendWidth / legendData.length;

    // Create an SVG element inside the color bar container
    const svg = container
        .append("svg")
        .attr("width", legendWidth)
        .attr("height", legendHeight);

    // Append a group for each legend item
    const legend = svg
        .selectAll(".legend")
        .data(legendData)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${i * blockWidth}, 0)`);

    // Append rectangles for each color
    legend
        .append("rect")
        .attr("width", blockWidth - 2) // Add spacing between blocks
        .attr("height", 10)
        .attr("fill", (d) => d.color);

    // Append labels below each block   
    legend
        .append("text")
        .attr("x", blockWidth / 2)
        .attr("y", 28)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text((d) => d.label);

    // Highlight countries corresponding to the range on hover
    legend
        .on("mouseover", function (event, d) {
            d3.selectAll(".Country")
                .transition()
                .duration(200)
                .style("opacity", (country) => {
                    const density = country.total || 0;
                    return density >= d.range[0] && density < d.range[1] ? 1 : 0.3;
                });
        })
        .on("mouseout", function () {
            d3.selectAll(".Country")
                .transition()
                .duration(200)
                .style("opacity", 1);
        });
}

// Call the function to create the legend bar after the map is ready
Promise.all([
    d3.json(worldmap),
    d3.csv(worldpopulationdesity).then((rawData) => {
        filteredData = rawData.filter((d) => d["Year"] === "2023");
        filteredData.forEach((d) => {
            data.set(d["Code"], +d["Population density"]);
        });
    }),
])
    .then(([geojson]) => {
        ready(null, geojson);
        // Call the fitMapToSVG function to ensure the map fits the SVG
        createLegendBar(); // Add the legend bar
    })
    .catch((error) => {
        console.error("Error loading data:", error);
    });