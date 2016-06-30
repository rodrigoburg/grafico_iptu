var width = $("body").width()* 0.9
var height = 550
var margins = {
    bottom:110,
    left:70,
    right:70,
    top:80
}

var iniciar = function() {

    $('#botao_distrito').dropdown();

    $.getJSON("dados/valores.json", function (d) {
        window.dados = d
        window.dados_parseados = parseia_dados(d);
        desenha_grafico(dados_parseados);
    })
}

function conserta_faixa(faixa) {
    traducao = {
        '100000':'Menor que R$ 100 mil',
        '200000':'Entre R$ 100 mil e R$ 200 mil',
        '300000':'Entre R$ 200 mil e R$ 300 mil',
        '500000':'Entre R$ 300 mil e R$ 500 mil',
        '1000000':'Entre R$ 500 mil e R$ 1 milhão',
        '10000000000':'Mais que R$ 1 milhão'
    }
    return traducao[faixa]
}

function conserta_tipo(tipo) {
    if (tipo == 'terreno_vazio') return "TERRENO VAZIO"
    if (tipo == 'total') return 'total'
    return tipo.toUpperCase()

}

function parseia_dados(data) {
    //nessa variável aqui vamos guardar os itens no formato do dimple (lista de dicionários)
    var saida = []

    //loopão
    var distritos = []
    var tipos = []
    for (var distrito in data) {
        if (distrito != 'total' && distrito != 'NA') distritos.push(distrito)
        for (var tipo in data[distrito]) {
            if ((tipos.indexOf(conserta_tipo(tipo)) == -1) && (tipo != 'total')) tipos.push(conserta_tipo(tipo))
            for (var faixa in data[distrito][tipo]) {
                var item = {"distrito":distrito,"tipo":conserta_tipo(tipo),"faixa":conserta_faixa(faixa),"numero":data[distrito][tipo][faixa]}
                saida.push(item)
            }
        }
    }

    //agora povoa o dropdown de distritos
    distritos = distritos.sort()
    $('#menu_distrito').append('<li><a href="#">TOTAL</a></li>')
    $('#menu_distrito').append(' <li role="separator" class="divider"></li>')

    distritos.forEach(function(distrito) {
        var opcao = '<li><a href="#">'+distrito+'</a></li>'
        $('#menu_distrito').append(opcao)
    })

    //agora povoa o dropdown de tipos
    tipos = tipos.sort()
    $('#menu_tipo').append('<li><a href="#">TOTAL</a></li>')
    $('#menu_tipo').append(' <li role="separator" class="divider"></li>')

    tipos.forEach(function(tipos) {
        var opcao = '<li><a href="#">'+tipos+'</a></li>'
        $('#menu_tipo').append(opcao)
    })

    return saida
}

window.grafico = null

function desenha_grafico(data) {
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

    ordem_x = ['Menor que R$ 100 mil','Entre R$ 100 mil e R$ 200 mil','Entre R$ 200 mil e R$ 300 mil','Entre R$ 300 mil e R$ 500 mil','Entre R$ 500 mil e R$ 1 milhão','Mais que R$ 1 milhão']

    var svg = dimple.newSvg("#grafico",width,height)
    data = dimple.filterData(data, "distrito", "total");
    data = dimple.filterData(data, "tipo", "total");
    data = dimple.filterData(data, "faixa", ordem_x);

    var myChart = new dimple.chart(svg, data);

    myChart.setBounds(margins.left, margins.top, width - margins.right, height - margins.bottom);
    var x = myChart.addCategoryAxis("x", ["faixa","distrito"]);

    x.addOrderRule(ordem_x)
    //x.addGroupOrderRule(ordem_x)

    var y = myChart.addMeasureAxis("y", "numero");
    var s = myChart.addSeries(["faixa","distrito"], dimple.plot.bar);

    myChart.draw();
    window.grafico = myChart
}

function atualiza_grafico(data,distrito,tipo) {
    ordem_x = ['Menor que R$ 100 mil','Entre R$ 100 mil e R$ 200 mil','Entre R$ 200 mil e R$ 300 mil','Entre R$ 300 mil e R$ 500 mil','Entre R$ 500 mil e R$ 1 milhão','Mais que R$ 1 milhão']
    var myChart = window.grafico
    data = dimple.filterData(data, "distrito", ["total",distrito]);
    data = dimple.filterData(data, "tipo", tipo);
    data = dimple.filterData(data, "faixa", ordem_x);
    console.log(data)
    myChart.data = data;
    myChart.draw();
}

iniciar()

