let tooltip = d3.select('#chartTooltip');
let width = document.getElementById('map').clientWidth,
    aspect = 1,
    height = width * aspect;

document.getElementById('map').style.height = height + 'px';

///Desarrollo del mapa
d3.queue()
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiaz/test_mapa_latam/main/data/ne_110m_admin_0_countries_lakes.json')
    .defer(d3.csv, 'https://raw.githubusercontent.com/CarlosMunozDiaz/test_mapa_latam/main/data/fichas_hxt.csv')
    .await(function(error, mapa, data) {
        if(error) throw error; 

        //Mapa
        let worldGeojson = topojson.feature(mapa, mapa.objects.ne_110m_admin_0_countries_lakes);
        let worldGeojsonInner = topojson.mesh(mapa, mapa.objects.ne_110m_admin_0_countries_lakes, (a, b) => a !== b);

        const features = worldGeojson.features.filter(d => d.properties.CONTINENT.includes("América") && !["Canadá", "Groenlandia", "Estados Unidos"].includes(d.properties.ADMIN));
        
        let laGeojson = {type: 'FeatureCollection', features};

        let projection = d3.geoAzimuthalEqualArea()
            .rotate([80, 10])
            .fitSize([width - 1, height], laGeojson);

        let path = d3.geoPath(projection);

        //Datos
        let features1 = [], features2 = [];
        for(let i = 0; i < laGeojson.features.length; i++) {
            let hasData = data.filter(function(item) {
                if(item.Pais == laGeojson.features[i].properties.ADMIN) {
                    return item;
                }
            });

            laGeojson.features[i].data = hasData;
        }

        //Podemos hacer división entre los que sí tienen datos y los que no
        for(let i = 0; i < laGeojson.features.length; i++) {            
            if(laGeojson.features[i].data.length != 0) {
                features1.push(laGeojson.features[i]);
            } else {
                features2.push(laGeojson.features[i]);
            }
        }

        let laWith = {type: 'FeatureCollection', features: features1};
        let laWithout = {type: 'FeatureCollection', features: features2};

        console.log(laGeojson, laWith, laWithout);

        const svg = d3.select('#map')
            .append('svg')
            .attr("width", width - 1)
            .attr("height", height);
    
        svg.append("path")
            .datum(d3.geoGraticule())
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#f0f0f0");

        //Países con datos
        svg.selectAll("country")
            .data(laWith.features)
            .enter()
            .append("path")
            .attr("class", "country-yes")
            .attr("fill", '#113678')
            .attr("d", path)
            .on('click', function(d,i,e) {
                let html = '<p class="chart__tooltip--title"> ' + d.properties.ADMIN + '</p>';
                for(let i = 0; i < d.data.length; i++) {
                    html += '<div class="chart__tooltip_b-text"><p class="chart__tooltip--text" id="tooltip-text">' + d.data[i].Titulo_ES + '</p><a href="www.elconfidencial.com" target=_blank>Consulta aquí</a></div>';
                }
                document.getElementById('tooltip-content').innerHTML = html;

                tooltip.classed('visible', true);
            });
        
        //Países sin datos
        svg.selectAll("country")
            .data(laWithout.features)
            .enter()
            .append("path")
            .attr("class", "country-none")
            .attr("fill", '#d9d9d9')
            .attr("d", path);

        //Todos
        // svg.selectAll(".country")
        //     .data(laGeojson.features)
        //     .enter()
        //     .append("path")
        //     .attr("class", "country")
        //     .attr("fill", 'red')
        //     .attr("d", path);
        
        //Otros
        svg.append("path")
            .datum(worldGeojsonInner)
            .attr("fill", "none")
            .attr("stroke", "#c3c3c3")
            .attr("d", path);


        //Cuando se clique en la cruz de cierre, cerramos el tooltip
        document.getElementById('tooltip-close').addEventListener('click', function(e) {
            e.preventDefault();

            tooltip.classed('visible',false);
        });
    });