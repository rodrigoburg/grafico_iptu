String.prototype.capitalize = function() {
    var saida = ""
    this.split(" ").forEach(function (d) {
        saida += d.charAt(0).toUpperCase() + d.slice(1).toLowerCase() + " ";
    })
    return saida
}

function numero_com_pontos(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


var width = $("body").width()* 0.9
var height = 550
var margins = {
    bottom:110,
    left:70,
    right:70,
    top:80
}

var distrito_selec = "TOTAL";
var tipo_select = "TOTAL";
var valor_select;

var iniciar = function() {
    $.getJSON("dados/valores.json", function (d) {
        window.dados = d
        window.dados_parseados = parseia_dados(d);
        desenha_grafico(dados_parseados);
        inicia_dropdowns()
    })
}

function inicia_dropdowns() {
    //povoa o dropdown de distritos
    distritos = distritos.sort()
    $('#menu_distrito').append('<li><a href="#">TOTAL <span class="glyphicon glyphicon-ok distrito_ok"></span></a></li>')
    $('#menu_distrito').append(' <li role="separator" class="divider"></li>')

    distritos.forEach(function(distrito) {
        var opcao = '<li><a href="#">'+distrito+'</a></li>'
        $('#menu_distrito').append(opcao)
    })

    //agora povoa o dropdown de tipos
    tipos = tipos.sort()
    $('#menu_tipo').append('<li><a href="#">TOTAL <span class="glyphicon glyphicon-ok tipo_ok"></span></a></li>')
    $('#menu_tipo').append(' <li role="separator" class="divider"></li>')

    tipos.forEach(function(tipos) {
        var opcao = '<li><a href="#">'+tipos+'</a></li>'
        $('#menu_tipo').append(opcao)
    })

    //agora iniciamos ambos e colocamos os eventos
    $('#botao_distrito').dropdown();
    $("#menu_distrito").find("li").on("click", function () {
        $(".distrito_ok").remove()
        var el = $(this)
        distrito_selec = $(this).text().trim()
        $(this).html('<a href="#">'+distrito_selec + ' <span class="glyphicon glyphicon-ok distrito_ok"></span></a>')
        atualiza_grafico(dados_parseados,distrito_selec,tipo_select);
    })

    $('#botao_tipo').dropdown();
    $("#menu_tipo").find("li").on("click", function () {
        $(".tipo_ok").remove()
        var el = $(this)
        tipo_select = $(this).text().trim()
        $(this).html('<a href="#">'+tipo_select + ' <span class="glyphicon glyphicon-ok tipo_ok"></span></a>')
        atualiza_grafico(dados_parseados,distrito_selec,tipo_select);
    })

    //aqui coloca o evento no botão de calcular
    $("#calcular").on("click",function () {
        valor_select = $("#usr").val()
        if (valor_select) {
            atualiza_textos(valor_select);
        }

    })
}


function conserta_faixa(faixa) {
    traducao = {
        '100000':'Menor que R$ 100 mil',
        '200000':'Entre R$ 100 mil e R$ 200 mil',
        '300000':'Entre R$ 200 mil e R$ 300 mil',
        '500000':'Entre R$ 300 mil e R$ 500 mil',
        '1000000':'Entre R$ 500 mil e R$ 1 milhão',
        '10000000000':'Mais que R$ 1 milhão',
        'TOTAL':'TOTAL'
    }
    return traducao[faixa]
}

function acha_faixa(faixa) {
    faixa = parseInt(faixa);
    if (faixa < 100000) faixa = '100000'
    else if (faixa < 200000) faixa = '200000'
    else if (faixa < 300000) faixa = '300000'
    else if (faixa < 500000) faixa = '500000'
    else if (faixa < 1000000) faixa = '1000000'
    else faixa = '10000000000'
    return faixa
}

function conserta_tipo(tipo) {
    if (tipo == 'terreno_vazio') return "TERRENO VAZIO"
    return tipo.toUpperCase()
}

function traduz_tipo(tipo) {
    tipo = tipo.replace(" ","_")
    traducao = {
        'residencial':'imóveis residenciais',
        'comercial':'imóveis comerciais',
        'terreno_vazio':'terrenos vazios',
        'outros':'imóveis de uso variado',
        'TOTAL':'imóveis'
    }
    return traducao[tipo]
}

function traduz_distrito(distrito) {
    if (distrito == 'TOTAL') return "em São Paulo"
    return "no distrito de " + distrito.capitalize()
}

function parseia_dados(data) {
    //nessa variável aqui vamos guardar os itens no formato do dimple (lista de dicionários)
    var saida = []

    //loopão
    window.distritos = []
    window.tipos = []
    for (var distrito in data) {
        if (distrito != 'TOTAL' && distrito != 'NA') distritos.push(distrito)
        for (var tipo in data[distrito]) {
            if ((tipos.indexOf(conserta_tipo(tipo)) == -1) && (tipo != 'TOTAL')) tipos.push(conserta_tipo(tipo))
            for (var faixa in data[distrito][tipo]) {
                var item = {"distrito":distrito,"tipo":conserta_tipo(tipo),"faixa":conserta_faixa(faixa),"porcentual":parseInt((data[distrito][tipo][faixa]/data[distrito][tipo]["TOTAL"])*1000)/10}
                saida.push(item)
            }
        }
    }
    return saida
}

window.grafico = null

function desenha_grafico(data) {

    ordem_x = ['Menor que R$ 100 mil','Entre R$ 100 mil e R$ 200 mil','Entre R$ 200 mil e R$ 300 mil','Entre R$ 300 mil e R$ 500 mil','Entre R$ 500 mil e R$ 1 milhão','Mais que R$ 1 milhão']

    var svg = dimple.newSvg("#grafico",width,height)
    data = dimple.filterData(data, "distrito", distrito_selec);
    data = dimple.filterData(data, "tipo", tipo_select);
    data = dimple.filterData(data, "faixa", ordem_x);

    var myChart = new dimple.chart(svg, data);

    myChart.setBounds(margins.left, margins.top, width - margins.right, height - margins.bottom);
    var x = myChart.addCategoryAxis("x", ["faixa","distrito"]);

    x.addOrderRule(ordem_x)

    var y = myChart.addMeasureAxis("y", "porcentual");

    y.title = 'Porcentual de imóveis em cada faixa de valor'
    x.title = ''

    var s = myChart.addSeries(["faixa","distrito"], dimple.plot.bar);

    //customiza a tooltip
    s.getTooltipText = function(e) {
        var faixa = e.aggField[0];
        var distrito = e.aggField[1];
        return [
            distrito,
            faixa + ": " + e.y +"%"
        ];
    };

    legend = myChart.addLegend(-270, 30, 195, 220, "right");

    myChart.assignColor("TOTAL","#007CC0")
    distritos.forEach(function (d) {
        myChart.assignColor(d,"#A11217")
    })

    window.dados_filtrados = data;

    myChart.draw();
    window.grafico = myChart

    //torce as labels
    $(".dimple-axis-x").find('text').each(function (d) {
        $(this).attr('transform','rotate(30) translate(-50,0)');
    })
}

function atualiza_grafico(data,distrito,tipo) {
    ordem_x = ['Menor que R$ 100 mil','Entre R$ 100 mil e R$ 200 mil','Entre R$ 200 mil e R$ 300 mil','Entre R$ 300 mil e R$ 500 mil','Entre R$ 500 mil e R$ 1 milhão','Mais que R$ 1 milhão']
    var myChart = window.grafico
    data = dimple.filterData(data, "distrito", ["TOTAL",distrito]);
    data = dimple.filterData(data, "tipo", tipo);
    data = dimple.filterData(data, "faixa", ordem_x);
    window.dados_filtrados = data;
    myChart.data = data;
    myChart.draw(1000);
}

function atualiza_textos(valor) {
    var tipo_temp = traduz_tipo(tipo_select)
    var tipo = tipo_select.replace(" ","_")
    var faixa = acha_faixa(valor)
    var distrito = traduz_distrito(distrito_selec)

    if (faixa == "100000") {
        var num_temp = 0
        for (var faixa_temp in dados[distrito_selec][tipo]) {
            if ((faixa_temp != faixa) && (faixa_temp != 'TOTAL')) {
                num_temp += dados[distrito_selec][tipo][faixa_temp]
            }
        }
        var texto = '<p id="texto"> Há pelo menos <b>'+numero_com_pontos(num_temp) +'</b> '+tipo_temp+' mais caros que o seu em '

    } else if (faixa == "10000000000") {
        var num_temp = 0
        for (var faixa_temp in dados[distrito_selec][tipo]) {
            if ((faixa_temp != faixa) && (faixa_temp != 'TOTAL')) {
                num_temp += dados[distrito_selec][tipo][faixa_temp]
            }
        }
        var texto = 'Há pelo menos <b>'+numero_com_pontos(num_temp) +'</b> '+tipo_temp+' mais baratos que o seu em '

    } else {
        var baratos_temp = 0
        var caros_temp = 0
        for (var faixa_temp in dados[distrito_selec][tipo]) {
            if (faixa_temp < faixa) {
                baratos_temp += dados[distrito_selec][tipo][faixa_temp]
            } else if ((faixa_temp > faixa) && (faixa_temp != 'TOTAL')){
                caros_temp += dados[distrito_selec][tipo][faixa_temp]
                console.log(faixa_temp,faixa)
            }
        }
        var texto = 'Há pelo menos <b>'+numero_com_pontos(baratos_temp) +'</b> '+tipo_temp+' mais baratos que o seu e <b>'+ numero_com_pontos(caros_temp) +'</b> mais caros em '
    }

    var dados_temp = dimple.filterData(dados_filtrados,"faixa",conserta_faixa(faixa))
    dados_temp = dimple.filterData(dados_temp,"distrito",distrito_selec)
    var perc = dados_temp[0]["porcentual"]

    texto += '<b>' + distrito +"</b>. Na faixa de preços referente a esse imóvel, <b>" + conserta_faixa(faixa).toLowerCase().replace("r$","R$").replace("r$","R$") +"</b>, estão cerca de <b>" +perc+"%</b> do total deste tipo de imóvel nessa região.</p>"

    $("#texto").html(texto)
}

iniciar()

