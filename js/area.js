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

function sortNumber(a,b) {
    return a - b;
}

var deixar_labels = ['100000','200000','300000','400000','500000','600000','700000','800000','900000','1000000','1100000','1200000','1300000','1400000','1500000','1750000','2000000','2200000','2400000','2600000','2800000','3000000','3500000','4000000','4500000','5000000','6000000','7000000','8000000','9000000']

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
    $.getJSON("dados/valores_area.json", function (d) {
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
        $('#botao_distrito').text(distrito_selec)
        atualiza_grafico(dados_parseados,distrito_selec,tipo_select);
        atualiza_textos();
    })

    $('#botao_tipo').dropdown();
    $("#menu_tipo").find("li").on("click", function () {
        $(".tipo_ok").remove()
        var el = $(this)
        tipo_select = $(this).text().trim()
        $(this).html('<a href="#">'+tipo_select + ' <span class="glyphicon glyphicon-ok tipo_ok"></span></a>')
        $('#botao_tipo').text(tipo_select)
        atualiza_grafico(dados_parseados,distrito_selec,tipo_select);
        atualiza_textos();
    })

    //aqui coloca o evento no botão de calcular
    $("#calcular").on("click",function () {
        valor_select = $("#usr").val()
        if (valor_select) {
            atualiza_textos();
        }

    })
}

function acha_faixa(faixa) {
    faixa = parseInt(faixa);
    for (var f in faixas) {
        var temp = parseInt(faixas[f])
        if (faixa < temp) return faixas[f]
    }
}

function traduz_faixa(faixa) {
    var i = faixas.indexOf(faixa)
    if (i == 0) {
        return 'Menor que R$ '+numero_com_pontos(faixas[i])
    } else if (i == (faixas.length -1)) {
        return 'Maior que R$ '+numero_com_pontos(faixas[i-1])
    } else {
        return 'Entre R$ '+numero_com_pontos(faixas[i-1]) +' e R$ '+numero_com_pontos(faixas[i])
    }
}

function conserta_tipo(tipo) {
    if (tipo == 'terreno_vazio') return "TERRENO VAZIO"
    return tipo.toUpperCase()
}

function traduz_tipo(tipo) {
    tipo = tipo.replace(" ","_").toLowerCase();
    traducao = {
        'residencial':'imóveis residenciais',
        'comercial':'imóveis comerciais',
        'terreno_vazio':'terrenos vazios',
        'outros':'imóveis de uso variado',
        'total':'imóveis'
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
    window.faixas = []
    for (var distrito in data) {
        if (distrito != 'TOTAL' && distrito != 'NA') distritos.push(distrito)
        for (var tipo in data[distrito]) {
            if ((tipos.indexOf(conserta_tipo(tipo)) == -1) && (tipo != 'TOTAL')) tipos.push(conserta_tipo(tipo))
            for (var faixa in data[distrito][tipo]) {
                if ((faixas.indexOf(faixa) == -1 ) && (faixa != 'TOTAL')) faixas.push(faixa);
                var item = {"distrito":distrito,"tipo":conserta_tipo(tipo),"faixa":faixa,"porcentual":parseInt((data[distrito][tipo][faixa]/data[distrito][tipo]["TOTAL"])*10000)/100}
                saida.push(item)
            }
        }
    }
    return saida
}

window.grafico = null


function acha_ordem(lista) {
    var temp = []
    lista.forEach(function (d) {
        temp.push(parseInt(d))
    })
    temp.sort(sortNumber)
    var saida = []
    temp.forEach(function (d) {
        saida.push(""+d)
    })
    return saida
}

function desenha_grafico(data) {

    var svg = dimple.newSvg("#grafico",width,height)
    data = dimple.filterData(data, "distrito", distrito_selec);
    data = dimple.filterData(data, "tipo", tipo_select);
    data = dimple.filterData(data, "faixa", faixas);

    var myChart = new dimple.chart(svg, data);

    myChart.setBounds(margins.left, margins.top, width - margins.right, height - margins.bottom);
    var x = myChart.addCategoryAxis("x", ["faixa","distrito"]);

    var ordem_faixas = acha_ordem(faixas)
    x.addOrderRule(ordem_faixas)

    var y = myChart.addMeasureAxis("y", "porcentual");

    y.title = 'Porcentual de imóveis em cada faixa de valor'
    x.title = ''

    var s = myChart.addSeries("faixa", dimple.plot.bar);

    //customiza a tooltip
    s.getTooltipText = function(e) {
        var faixa = e.aggField[0]
        return [
            traduz_faixa(faixa) + ": " + e.y +"%"
        ];
    };

    //myChart.assignColor("TOTAL","#007CC0")

    faixas.forEach(function (d) {
        myChart.assignColor(d,"#A11217")
    })

    window.dados_filtrados = data;

    myChart.draw();
    window.grafico = myChart

    //deixa só algumas labels
    $(".dimple-axis-x").find('text').each(function (d) {
        if (deixar_labels.indexOf($(this).text()) == -1) {
            $(this).remove()
        }
    })
}

function atualiza_grafico(data,distrito,tipo) {
    var myChart = window.grafico
    data = dimple.filterData(data, "distrito", distrito);
    data = dimple.filterData(data, "tipo", tipo);
    data = dimple.filterData(data, "faixa", faixas);
    window.dados_filtrados = data;
    myChart.data = data;
    myChart.draw(1000);
    //deixa só algumas labels
    $(".dimple-axis-x").find('text').each(function (d) {
        if (deixar_labels.indexOf($(this).text()) == -1) {
            $(this).remove()
        }
    })
}

function arruma_tipo(tipo) {
    if (tipo == 'TOTAL') return 'TOTAL'
    return tipo.replace(" ","_").toLowerCase();
}

function atualiza_textos() {
    if (valor_select) {
        var tipo_temp = traduz_tipo(tipo_select)
        var tipo = arruma_tipo(tipo_select)
        var faixa = acha_faixa(valor_select)
        var distrito = traduz_distrito(distrito_selec)

        if (faixa == "100000") {
            var num_temp = 0
            for (var faixa_temp in dados[distrito_selec][tipo]) {
                if ((faixa_temp != faixa) && (faixa_temp != 'TOTAL')) {
                    num_temp += dados[distrito_selec][tipo][faixa_temp]
                }
            }
            var texto = '<p id="texto"> Há pelo menos <b>'+numero_com_pontos(num_temp) +' '+tipo_temp+'</b> mais caros que o seu em '

        } else if (faixa == "10000000000") {
            var num_temp = 0
            for (var faixa_temp in dados[distrito_selec][tipo]) {
                if ((faixa_temp != faixa) && (faixa_temp != 'TOTAL')) {
                    num_temp += dados[distrito_selec][tipo][faixa_temp]
                }
            }
            var texto = 'Há pelo menos <b>'+numero_com_pontos(num_temp) +' '+tipo_temp+'</b> mais baratos que o seu em '

        } else {
            var baratos_temp = 0
            var caros_temp = 0
            for (var faixa_temp in dados[distrito_selec][tipo]) {
                if (faixa_temp < faixa) {
                    baratos_temp += dados[distrito_selec][tipo][faixa_temp]
                } else if ((faixa_temp > faixa) && (faixa_temp != 'TOTAL')){
                    caros_temp += dados[distrito_selec][tipo][faixa_temp]
                }
            }
            var texto = 'Há pelo menos <b>'+numero_com_pontos(baratos_temp) +' '+tipo_temp+'</b> mais baratos que o seu e <b>'+ numero_com_pontos(caros_temp) +'</b> mais caros em '
        }

        var dados_temp = dimple.filterData(dados_filtrados,"faixa",faixa)
        dados_temp = dimple.filterData(dados_temp,"distrito",distrito_selec)
        var perc = dados_temp[0]["porcentual"]

        texto += '<b>' + distrito +"</b>. Na faixa de preços referente a esse imóvel, <b>" + traduz_faixa(faixa).toLowerCase().replace('r$','R$').replace('r$','R$') +"</b>, estão cerca de <b>" +perc+"%</b> do total deste tipo de imóvel nessa região.</p>"

        $("#texto").html(texto)
    }
}

iniciar()

