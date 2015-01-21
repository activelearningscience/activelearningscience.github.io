var xAxis = 'pretestscore', yAxis = 'gain';

// SVG AND D3 STUFF
var svg = d3.select("#chart")
	.append("svg")
	.attr("width", 1000)
	.attr("height", 640);
var xScale, yScale;

var c10 = d3.scale.category10();

function init(data, testData) {
	xScale = d3.scale.linear().domain([0, 100]).range([20, 780]);
	yScale = d3.scale.linear().domain([0, 1]).range([600, 100]);

	var marginLeft = 80;
	var marginTop = -60;

	var absLeft = parseInt(d3.select('#chart').style('left')) + marginLeft;
	var absTop = parseInt(d3.select('#chart').style('top')) + marginTop;

	svg.append('g')
		.classed('chart', true)
		.attr('transform', 'translate('+ marginLeft +', '+ marginTop +')');

	var line = d3.svg.line()
		.x(function(d, i) { return xScale(d[0]); })
		.y(function(d, i) { return yScale(d[1]); });

	// Best fit line (to appear behind points)
	d3.select('svg g.chart')
		.selectAll('path')
		.data([[[0, 0.6], [100, 0]], [[0, 0.3], [100, 0]]])
		.enter()
		.append('path')
		.classed('bg-line', true)
		.style('opacity', 0)
		.attr('d', line)
	    .transition()
		.duration(1500)
		.style('opacity', 1);

	// Axis labels
	d3.select('svg g.chart')
		.append('text')
		.attr({'id': 'xLabel', 'x': 400, 'y': 670, 'text-anchor': 'middle'})
		.text('Pretest score (%)');

	d3.select('svg g.chart')
		.append('text')
		.attr('transform', 'translate(-60, 330)rotate(-90)')
		.attr({'id': 'yLabel', 'text-anchor': 'middle'})
		.text('Gain');


	// Render axes
	d3.select('svg g.chart')
		.append("g")
		.attr('transform', 'translate(0, 630)')
		.attr('id', 'xAxis')
		.call(makeXAxis);

	d3.select('svg g.chart')
		.append("g")
		.attr('id', 'yAxis')
		.attr('transform', 'translate(-10, 0)')
		.call(makeYAxis);

	// Render points
	
	// var pointColor = d3.scale.category20();
	// var c20 = d3.scale.category20b();
	// function pointColor(num) {
	// 	return num > 10 ? c20(2 * (num - 10) - 1) : c10(num);
	// };
	var pointColor = c10;

	d3.select('svg g.chart')
		.selectAll('circle')
		.data(data)
		.enter()
		.append('circle')
		.style('opacity', 0)
		.attr('r', 10)
		.attr('cx', function(d) {
			return isNaN(d[xAxis]) ? d3.select(this).attr('cx') : xScale(d[xAxis] * 100);
		})
		.attr('cy', function(d) {
			return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
		})
		.attr('fill', function(d, i) { return pointColor(testData[d.test].id); })
		.on('mouseover', function(d) {
			//Get this bar's x/y values, then augment for the tooltip
			var xPosition = xScale(d[xAxis] * 100) + absLeft;
			var yPosition = yScale(d[yAxis]) + absTop - 40;

			var fName = testData[d.test].fullName || '';
			var desc = testData[d.test].description || '';
			var ref = testData[d.test].ref || '';

			var $tip = $('#tooltip');
			$tip.css('left', xPosition);
			$tip.find('h3').html(fName);
			$tip.find('.description').html(desc);
			$tip.find('.reference').html(ref);

			var yPosition = yPosition - $tip.height();

			$tip.css('top', yPosition);

			if (testStatus[d.test]) {
				$tip.show();
			}
		})
		.on("mouseout", function() {
			$('#tooltip').hide();
		});
}

function updateChart(testStatus) {
	d3.select('svg g.chart')
		.selectAll('circle')
		.transition()
		.duration(500)
		.ease('quad-out')
		.style('opacity', function(d) {
			return testStatus[d.test] ? 1 : 0;
		});
}

function makeXAxis(s) {
	s.call(d3.svg.axis()
		.scale(xScale)
		.orient("bottom"));
}

function makeYAxis(s) {
	s.call(d3.svg.axis()
		.scale(yScale)
		.orient("left"));
}

var testStatus;

d3.json("data/tests.json", function(error, tests) {
	if (error) return console.warn(error);

	tests = _(tests).map(function(obj) {
		return _(obj).assign({selected: false}).value()
	}).value();

	var menu = d3.select('#x-axis-menu').selectAll('li')
		.data(tests);

	menu.enter()
		.append('li')
		.each(function(d) {
			var that = d3.select(this);
	        that.append("i")
	        	.style('background-color', c10(d.id));
	        that.append("span")
	        	.text(d.name);
	    });

	menu.on('click', function(d, i) {
		updateData(d, i);
		updateMenu();
	});

	d3.json("data/data.json", function(error, data) {
		if (error) return console.warn(error);
		
		// data = _.filter(data, function(d) {
		// 	return d.gain >= 0 && d.gain <= 1 && d.pretestscore >=0 && d.pretestscore <= 1;
		// });

		var testData = _(tests).indexBy('name').value();
		init(data, testData);
	});
	
	function updateData(d, i) {
		tests[i].selected = !d.selected;
	}

	function updateMenu() {
		menu
			.data(tests)
			.classed('selected', function(d) {
				return d.selected;
			});
		
		testStatus = _(tests).indexBy('name').mapValues('selected').value();

		updateChart(testStatus);
	}
});
