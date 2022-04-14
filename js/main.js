let tooltip = d3.select('#chartTooltip');
let width = document.getElementById('map').clientWidth,
    aspect = 1,
    height = width * aspect;

document.getElementById('map').style.height = height + 'px';

d3.json('../data/ne_110m_admin_0_countries_lakes.json', function(error,worldTopojson) {
    if (error) throw error;

    let worldGeojson = topojson.feature(worldTopojson, worldTopojson.objects.ne_110m_admin_0_countries_lakes);
    let worldGeojsonInner = topojson.mesh(worldTopojson, worldTopojson.objects.ne_110m_admin_0_countries_lakes, (a, b) => a !== b);

    const features = worldGeojson.features.filter(d => d.properties.CONTINENT.includes("America") && !["Canada", "Greenland", "United States of America"].includes(d.properties.ADMIN));

    let laGeojson = {type: 'FeatureCollection', features};

    let projection = d3.geoAzimuthalEqualArea()
        .rotate([80, 10])
        .fitSize([width - 1, height], laGeojson);

    let path = d3.geoPath(projection);

    const svg = d3.select('#map')
        .append('svg')
        .attr("width", width - 1)
        .attr("height", height);
  
    svg.append("path")
        .datum(d3.geoGraticule())
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#f0f0f0");
    
    svg.selectAll(".country")
        .data(laGeojson.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("fill", "#ddd")
        .attr("d", path)
        .on('click', function(d,i,e) {
            document.getElementById('tooltip-title').textContent = d.properties.ADMIN;
            if(d.properties.ADMIN == 'Mexico') {
                document.getElementById('tooltip-text').textContent = `El Fondo TIBET todavía no tiene iniciativas en este país`;
            } else {
                document.getElementById('tooltip-text').textContent = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ultrices, urna ac posuere tristique, mi urna convallis neque, vitae convallis velit enim sollicitudin dolor. Nunc sodales fringilla est non ultrices. Nulla ut sapien a augue aliquam semper. Proin sagittis congue posuere. Aliquam id libero pulvinar, laoreet lectus ac, euismod urna. Maecenas dictum sodales mauris, nec fringilla ex sagittis a. Cras id libero elementum, tempus eros molestie, sagittis augue. Nunc laoreet, sem vel blandit auctor, ipsum dolor feugiat nunc, nec elementum arcu sem vel sapien`;
            }
            


            tooltip.classed('visible', true);
        });
    
    svg.append("path")
        .datum(worldGeojsonInner)
        .attr("fill", "none")
        .attr("stroke", "#262626")
        .attr("d", path);


    //Cuando se clique en la cruz de cierre, cerramos el tooltip
    document.getElementById('tooltip-close').addEventListener('click', function(e) {
        e.preventDefault();

        tooltip.classed('visible',false);
    })
});