  
  function provincesMapShow(){
            $('#map2').hide();           
            $('#map').show();
            map2_chart.filterAll();
            dc.redrawAll();
        }
        
        function municipalitiesMapShow(){
            $('#map').hide();
            $('#map2').show();
        }
		
        $('#dashboard').hide();
        $('#map').hide();
		$('#services').hide();
		
		var map_chart = dc.geoChoroplethChart("#map");
        var map2_chart = dc.geoChoroplethChart("#map2");
        var sector_chart = dc.rowChart("#sectors");
		var service_chart = dc.rowChart("#services");
		var organisation_chart = dc.rowChart("#organisations");
		var dataTable = dc.dataTable("#dc-table-graph");
        
        d3.dsv(';')("data/3W_Data.csv", function(csv_data){
            
			var cf = crossfilter(csv_data);
            
			cf.id = cf.dimension(function(d) {return d.ID; });
            cf.sector = cf.dimension(function(d) { return d.Sector; });
            cf.service = cf.dimension(function(d) { return d.Service; });
            cf.pcode = cf.dimension(function(d) { return d.Province_CODE; });
            cf.organisation = cf.dimension(function(d) { return d.Organisation; });
            cf.mcode = cf.dimension(function(d) { return d.Municipality_CODE; });
			 
            var sector = cf.sector.group();
            var service = cf.service.group().reduceSum(function(d) {return d.Beneficiaries;});
            var pcode = cf.pcode.group();
            var organisation = cf.organisation.group();
            var mcode = cf.mcode.group();
            var all = cf.groupAll();
			
			sector_chart.width(320).height(300)
                .dimension(cf.sector)
                .group(sector)
                .elasticX(true)
                .data(function(group) {
                    return group.top(6);
                })
                .colors(['#BF002D'])
                .colorDomain([0,0])
                .colorAccessor(function(d, i){return 1;})  
				.on('filtered',function(chart,filters){
					if (chart.filters().length > 0) { $('#services').show();}
					else {$('#services').hide();}
				})
				;
		
 			service_chart.width(320).height(300)
                .dimension(cf.service)
                .group(service)
                .elasticX(true)
                .data(function(group) {
                    return group.top(10).filter( function (d) { return d.value !== 0; } );
                })
                .colors(['#BF002D'])
                .colorDomain([0,0])
                .colorAccessor(function(d, i){return 1;})
				.xAxis().ticks(5)
				;
			
			organisation_chart.width(320).height(300)
                .dimension(cf.organisation)
                .group(organisation)
                .elasticX(true)
                .data(function(group) {
                    return group.top(10).filter( function (d) { return d.value !== 0; } );
                })
                .colors(['#BF002D'])
                .colorDomain([0,0])
                .colorAccessor(function(d, i){return 1;})
				.xAxis().ticks(5)
				;
			
			// Table of activities data
			  dataTable.width(960).height(800)
				.dimension(cf.mcode)
				.group(function(d) { return ""; })
				.size(200)
				.columns([
				  function(d) { return d.Organisation; },
				  function(d) { return d.Sector; },
				  function(d) { return d.Subsector; },
				  function(d) { return d.Service; },
				  function(d) { return pcode2prov[d.Province_CODE]; },
				  function(d) { return mcode2mun[d.Municipality_CODE]; },
				  function(d) { return d.Barangay; },
				  function(d) { return d.Status; },
				  function(d) { return d.Beneficiaries; },
				  function(d) { return d.Beneficiary_type; }
				])
				.order(d3.ascending)
				.sortBy(function (d) {
						   return [d.Sector,d.Subsector,d.Service,pcode2prov[d.Province_CODE],mcode2mun[d.Municipality_CODE]].join();
				})
				;
				
			
            dc.dataCount("#count-info")
		.dimension(cf)
		.group(all);
                            
            d3.json("data/Phil_provinces.geojson", function (provincesJSON) {
                
                map_chart.width(800).height(900)
                    .dimension(cf.pcode)
                    .group(pcode)
					.colors(d3.scale.quantile()
									.domain([1,50])
									.range(['#E5CF00','#DDA509','#D57C12','#CE521B','#C62924','#BF002D']))
					.colorCalculator(function (d) { return d ? map_chart.colors()(d) : '#cccccc'; })
                    .overlayGeoJson(provincesJSON.features, "Province", function (d) {
                        return d.properties.P_Str;
                    })
                    .projection(d3.geo.mercator().center([125.8,8.1]).scale(7500))
                    .title(function (d) {
                        return "Province: " + pcode2prov[d.key] + " - " + d.value + ' activities';
                    });
                    
                    d3.json("data/Phil_municipalities.geojson", function (municJSON){
                        map2_chart.width(800).height(900)
                            .dimension(cf.mcode)
                            .group(mcode)
							.colors(d3.scale.quantile()
											.domain([1,12])
											.range(['#E5CF00','#DDA509','#D57C12','#CE521B','#C62924','#BF002D']))
							.colorCalculator(function (d) { return d ? map2_chart.colors()(d) : '#cccccc'; })
                            .overlayGeoJson(municJSON.features, "Municipalities", function (d) {
                                return d.properties.MUN_P_STR;
                            })
                            .projection(d3.geo.mercator().center([125.8,8.1]).scale(7500))
                            .title(function (d) {
                                return "Municipality: " + mcode2mun[d.key] + " - " + d.value + ' activities';
                            });
					
					$('#loading').hide();
                    $('#dashboard').show();
                    dc.renderAll();
                            
                    });                    
                });            
        });
