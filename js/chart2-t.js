$(function() {

    var svg = d3.select(".chart2-line")
        .append("div")
        .classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", "0 0 1000 450"),
        margin = {
            top: 40,
            right: 40,
            bottom: 30,
            left: 40
        },
        width = +1000 - margin.left - margin.right,
        height = +450 - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var color = ["#B4EEB4", "#98abc5"]
    var x = d3.scaleTime()
        .rangeRound([0, width]);
    var y = d3.scaleLinear()
        .rangeRound([height, 0]);
    var parseDate = d3.timeParse("%m-%d");

    var line = d3.line()
        .curve(d3.curveCardinal)
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.stat);
        });

    var countries,
        filtered,
        transpose;
    var num = 1;
    var menu = d3.select("#menu select")
        .on("change", change);
    d3.csv("/data/datamon.csv", function(d) {
        countries = d;
        redraw();
    });

    d3.select(window)
        .on("keydown", function() {
            altKey = d3.event.altKey;
        })
        .on("keyup", function() {
            altKey = false;
        });

    var altKey;

    function change() {

        clearTimeout(timeout);
        d3.transition()
            .duration(altKey ? 7500 : 1500)
            .each(redraw);
    }

    function redraw() {

        var nested = d3.nest()
            .key(function(d) {
                return d.year;
            })
            .rollup(function(v) {
                return v;
            })
            .map(countries)

        var series = menu.property("value");
        var data = nested["$" + series];

        var keyring = d3.keys(data[0]).filter(function(key) {
            return (key !== "date" && key !== "year");
        });

        var transpose = keyring.map(function(name) {
            return {
                name: name,
                values: data.map(function(d) {
                    return {
                        date: parseDate(d.date),
                        stat: +d[name]
                    };
                })
            };
        });

        x.domain([
            d3.min(transpose, function(c) {
                return d3.min(c.values, function(v) {
                    return v.date;
                });
            }),
            d3.max(transpose, function(c) {
                return d3.max(c.values, function(v) {
                    return v.date;
                });
            })
        ]);

        y.domain([
            d3.min(transpose, function(c) {
                return d3.min(c.values, function(v) {
                    return v.stat;
                });
            }),
            d3.max(transpose, function(c) {
                return d3.max(c.values, function(v) {
                    return v.stat;
                });
            })
        ]);


        var country = svg.selectAll(".country")
            .data(transpose);

        var countryEnter = country.enter().append("g")
            .attr("class", "country")
            .attr("id", function(d) {
                return d.name;
            });

        countryEnter.append("path")
            .attr("class", "line")
            .attr("d", function(d) {
                return line(d.values);
            })
            .style("stroke", function(d) {
                if (d.name == "all")
                    return color[0];
                else return color[1];
            });

        countryEnter.append("text")
            .attr("class", "names")
            .datum(function(d) {
                return {
                    name: d.name,
                    value: d.values[d.values.length - 1]
                };
            })
            .attr("transform", function(d) {
                return "translate(" + x(d.value.date) + "," + y(d.value.stat) + ")";
            })
            .attr("x", 4)
            .attr("dy", ".35em")
            .text(function(d) {
                return d.name;
            });
        var t = d3.transition()
            .duration(1500)
        country.transition(t)
            .select("path")
            .attr("d", function(d) {
                return line(d.values);
            });

        country.transition(t)
            .select("text")
            .attr("transform", function(d) {
                return "translate(" + x(d.values[d.values.length - 1].date) + "," + y(d.values[d.values.length - 1].stat) + ")";
            });

        d3.transition(svg).select(".y.axis")
            .call(d3.axisLeft(y));

        var xAxis = d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(function(d) {
            return String(d).slice(4, 7);
        });
        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .attr("stroke", "#cfcfcf")
            .select(".domain")
            .remove();

        var yAxis = d3.axisLeft(y).ticks(6)
        svg.append("svg:g")
            .attr("class", "yAxis");
        d3.transition(svg).select(".yAxis")
            .call(yAxis)

        g.append("g")
            .append("text")
            .attr("stroke", "#cfcfcf")
            .attr("transform", "translate(10, -40)")
            .attr("dy", "1em")
            .attr("text-anchor", "end")
            .text("Box(¥10,000)")
            .transition(svg);


        var legendLine = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 12)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(["all films", "foreign films"])
            .enter().append("g")
            .attr("transform", function(d, i) {
                return "translate(" + 0 + "," + (i * 30) + ")";
            });

        legendLine.append("rect")
            .attr("x", width + 25)
            .attr("y", 0)
            .attr("width", 19)
            .attr("height", 2)
            .attr("fill", function(d) {
                if (d == "all films") return "#B4EEB4";
                else return "#98abc5";
            });

        legendLine.append("text")
            .attr("x", width + 24)
            .attr("y", 0)
            .attr("dy", "0.32em")
            .attr("fill", "#bfbfbf")
            .text(function(d) {
                return d;
            });

    }

    var timeout = setTimeout(function() {
        menu.property("value", 2008).node().focus();
        change();
    }, 3000);

    d3.interval(function() {
        yrs = num % 10;
        menu.property("value", 2008 + yrs).node().focus();
        change();
        num += 1;
    }, 3000)
})