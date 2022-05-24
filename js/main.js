let tooltip = d3.select('#chartTooltip');

let auxAspect = document.body.clientWidth < 400 ? 1.1 : document.body.clientWidth < 360 ? 1.5 : 1;

let width = document.getElementById('map').clientWidth,
    aspect = auxAspect,
    height = width * aspect;

document.getElementById('map').style.height = height + 'px';

//Colores
const tipo1 = '', tipo2 = '', tipo3 = '', tipo4 = '', tipo5 = '';

///Desarrollo del mapa
d3.queue()
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiaz/test_mapa_latam/main/data/ne_110m_admin_0_countries_lakes.json')
    .defer(d3.csv, 'https://raw.githubusercontent.com/CarlosMunozDiaz/test_mapa_latam/main/data/fichas_tvet.csv')
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

        const zoom = d3.zoom()
            .scaleExtent([1, 5])
            .translateExtent([[0,0], [width, height]])
            .extent([[0, 0], [width, height]])
            .on('zoom', zoomed);

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

        const svg = d3.select('#map')
            .append('svg')
            .attr("width", width - 1)
            .attr("height", height);

        const g = svg.append('g');
    
        g.append("path")
            .datum(d3.geoGraticule())
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#f0f0f0");

        //Países con datos

        let isMobile = window.matchMedia("only screen and (max-width: 820px)").matches;

        console.log(isMobile);

        g.selectAll("country")
                .data(laWith.features)
                .enter()
                .append("path")
                .attr("class", "country-yes")
                .attr("fill", '#113678')
                .attr("d", path)
                .on('pointerdown', function(d,i,e) {
                    drawTooltip(d);                               
                });        

        function drawTooltip(d) {
            d3.event.preventDefault();
            d3.event.stopPropagation();

            //Tooltip
            let html = '';

            //Título + Tipos
            html += '<div class="chart__tooltip--b_title"><p class="chart__tooltip--title">' + d.properties.ADMIN + '</p>';

            //Bucle para sus tipos
            html += '<div class="chart__tooltip--b_types">';
            let tipos = d.data[0].tipos.split('|');
            for(let i = 0; i < tipos.length; i++) {
                if(tipos[i] == 'cuarta_revolucion_industrial'){
                    html += '<span class="chart__tooltip--type cuarta_revolucion_industrial"></span>';
                } else if (tipos[i] == 'envejecimiento') {
                    html += '<span class="chart__tooltip--type envejecimiento"></span>';
                } else if (tipos[i] == 'cambio_climatico') {
                    html += '<span class="chart__tooltip--type cambio_climatico"></span>';
                } else if (tipos[i] == 'diversidad') {
                    html += '<span class="chart__tooltip--type diversidad"></span>';
                } else {
                    html += '<span class="chart__tooltip--type covid19"></span>';
                }
            }

            html += '</div></div>';
            
            //Bucle para enlaces
            for(let i = 0; i < d.data.length; i++) {
                html += '<div class="chart__tooltip_b-text"><p class="chart__tooltip--text" id="tooltip-text">' + d.data[i].Titulo_ES + '</p><a href="' + d.data[i].link + '" target=_blank>Más información</a></div>';
            }

            setTimeout( function() {
                document.getElementById('tooltip-content').innerHTML = html;
            }, 200);
            
            tooltip.classed('visible', true);
        }        
        
        //Países sin datos
        g.selectAll("country")
            .data(laWithout.features)
            .enter()
            .append("path")
            .attr("class", "country-none")
            .attr("fill", '#d9d9d9')
            .attr("d", path);
        
        //Otros
        g.append("path")
            .datum(worldGeojsonInner)
            .attr("fill", "none")
            .attr("stroke", "#c3c3c3")
            .attr("d", path);

        //Zoom
        svg.call(zoom);

        function zoomed() {
            g.selectAll('path').attr('transform', d3.event.transform);
            tooltip.classed('visible',false);
        }

        //Cuando se clique en la cruz de cierre, cerramos el tooltip
        document.getElementById('tooltip-close').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            document.getElementById('tooltip-content').innerHTML = '';

            tooltip.classed('visible',false);
        });
    });
