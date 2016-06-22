var width = $("body").width()* 0.9
var height = 550
var margins = {
    bottom:110,
    left:70,
    right:70,
    top:80
}

var iniciar = function() {
    $.getJSON("dados/valores.json", function (d) {
        window.dados = parseia_dados(d)
    })
}

function parseia_dados(data) {
    var total = {}
    var temp = 0
    for (var distrito in data) {
        var temp1 = 0
        for (var tipo in data[distrito]) {
            if (!(tipo in total)) {
                total[tipo] = {}
            }
            var temp2 = 0
            for (var faixa in data[distrito][tipo]) {
                if (!(faixa in total[tipo])) {
                    total[tipo][faixa] = 0
                }
                total[tipo][faixa] += data[distrito][tipo][faixa]
                temp2 += data[distrito][tipo][faixa]
            }
            data[distrito][tipo]["total"] = temp2
            temp1 += temp2
        }
        data[distrito]["total"] = temp1
        temp += temp1
    }
    total["total"] = temp
    for (tipo in total) {
        var temp1 = 0
        for (var faixa in total[tipo]) {
            temp1 += total[tipo][faixa]
        }
        total[tipo]["total"] = temp1
    }

    data["total"] = total
    return data
}

window.grafico = null

function desenha_grafico() {
    var cores_default = [
        "#A11217",
        "#BA007C",
        "#5E196F",
        "#00408F",
        "#007CC0",
        "#009493",
        "#00602D",
        "#A3BD31",
        "#E9BC00",
        "#634600"
    ]

    var svg = dimple.newSvg("#grafico",width,height)
    var myChart = new dimple.chart(svg, dados);


    myChart.setBounds(margins.left, margins.top, width - margins.right, height - margins.bottom);
    var x = myChart.addCategoryAxis("x", "faixa");

    ordem_x = []
    x.addOrderRule(ordem_x)
    x.addGroupOrderRule(ordem_x)

    var y = myChart.addMeasureAxis("y", "numero");

    x.fontSize = "12px"
    y.fontSize = "12px"

    //y.overrideMax = 20000000000.0


    var s = myChart.addSeries(null, dimple.plot.bar);

    s.stacked = false

    legenda = myChart.addLegend(margins.left+10,margins.top-20, width-margins.right, 200)

    ordem_legenda = []
    legenda._getEntries = function () {
        var orderedValues = ordem_legenda;
        var entries = [];
        orderedValues.forEach(function (v) {
            v = v.trim()
            entries.push(
                {
                    key: v,
                    fill: myChart.getColor(v).fill,
                    stroke: myChart.getColor(v).stroke,
                    opacity: myChart.getColor(v).opacity,
                    series: s,
                    aggField: [v]
                }
            );
        }, this);

        return entries;
    };


    myChart.draw();
    window.grafico = myChart
    x.shapes.selectAll("text").attr("transform",
        function (d) {
            //return d3.select(this).attr("transform") + " translate(-14, 38) rotate(-90)";
            return d3.select(this).attr("transform") + " translate(0, 20) rotate(-45)";
        }
    );

}

iniciar()

