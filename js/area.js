String.prototype.capitalize = function() {
    var saida = ""
    this.split(" ").forEach(function (d) {
        saida += d.charAt(0).toUpperCase() + d.slice(1).toLowerCase() + " ";
    })
    return saida
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement)
};

function numero_com_pontos(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function sortNumber(a,b) {
    return a - b;
}

function closest (num, arr) {
    var curr = arr[0];
    var diff = Math.abs (num - curr);
    for (var val = 0; val < arr.length; val++) {
        var newdiff = Math.abs (num - arr[val]);
        if (newdiff < diff) {
            diff = newdiff;
            curr = arr[val];
        }
    }
    return curr;
}

var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


var width = $("body").width()* 0.9
var margins = {
    bottom:65,
    left:55,
    right:60,
    top:10
}

if (width > 500) { //tela grande
    var deixar_labels = ['100000','200000','300000','400000','500000','600000','700000','800000','900000','1000000','1100000','1200000','1300000','1400000','1500000','1750000','2000000','2200000','2400000','2600000','2800000','3000000','3500000','4000000','4500000','5000000','6000000','7000000','8000000','9000000']
    var height = 450
} else { //celular
    var deixar_labels = ['100000','300000','500000','700000','900000','1100000','1300000','1500000','2000000','2400000','2800000','3500000','4500000','6000000','8000000','10000000']
    var height = 350
}

var distrito_selec = "TOTAL";
var tipo_select = "TOTAL";
var valor_select;
var svg;

var iniciar = function() {
    $('#outros').hide();
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
    $("#menu_distrito").find("li").on("click", function () {
        $(".distrito_ok").remove()
        var el = $(this)
        distrito_selec = $(this).text().trim()
        $(this).html('<a href="#">'+distrito_selec + ' <span class="glyphicon glyphicon-ok distrito_ok"></span></a>')
        $('#botao_distrito').text(distrito_selec)
        atualiza_grafico(dados_parseados,distrito_selec,tipo_select);
        atualiza_textos();
        cria_linha();
    })

    $("#menu_tipo").find("li").on("click", function () {
        $(".tipo_ok").remove()
        var el = $(this)
        tipo_select = $(this).text().trim()
        $(this).html('<a href="#">'+tipo_select + ' <span class="glyphicon glyphicon-ok tipo_ok"></span></a>')
        $('#botao_tipo').text(tipo_select)
        if (tipo_select == "OUTROS") {
            $("#outros").show();
        } else {
            $("#outros").hide();
        }
        atualiza_grafico(dados_parseados,distrito_selec,tipo_select);
        atualiza_textos();
        cria_linha();
    })

    //aqui coloca o evento no botão de calcular
    $("#calcular").on("click",function () {
        //força zoom out se for no cel
        $('body').css('zoom','100%'); /* Webkit browsers */
        $('body').css('zoom','1'); /* Other non-webkit browsers */
        $('body').css('-moz-transform','scale(1, 1)'); /* Moz-browsers */

        valor_select = $("#valor_imovel").val().replaceAll('.',"");
        if (valor_select) {
            atualiza_textos();
            cria_linha();
        }
    })

    //e aqui no proprio input
    $('#valor_imovel').keyup(function (e) {
        if (e.keyCode == 13) {
            //força zoom out se for no cel
            $('body').css('zoom','100%'); /* Webkit browsers */
            $('body').css('zoom','1'); /* Other non-webkit browsers */
            $('body').css('-moz-transform','scale(1, 1)'); /* Moz-browsers */

            valor_select = $("#valor_imovel").val().replaceAll('.',"")
            if (valor_select) {
                atualiza_textos();
                cria_linha();
            }

        }
    });

}

function acha_faixa(faixa) {
    faixa = parseInt(faixa);
    for (var f in faixas) {
        var temp = parseInt(faixas[f])
        if (faixa < temp) return faixas[f]
    }
    //se não achou nenhum valor menor, é pq é acima do valor máximo
    return "10000000000"
}

function traduz_faixa(faixa) {
    var i = faixas.indexOf(faixa)
    if (i == 0) {
        return 'de menos de R$ '+numero_com_pontos(faixas[i])
    } else if (i == (faixas.length -1)) {
        return 'de mais de R$ '+numero_com_pontos(faixas[i-1])
    } else {
        return 'entre R$ '+numero_com_pontos(faixas[i-1]) +' e R$ '+numero_com_pontos(faixas[i])
    }
}

function conserta_tipo(tipo) {
    if (tipo == 'terreno_vazio') return "TERRENO VAZIO"
    return tipo.toUpperCase()
}

function desconserta_tipo(tipo) {
    if (tipo == 'TERRENO VAZIO') return "terreno_vazio"
    if (tipo == 'TOTAL') return 'TOTAL'
    return tipo.toLowerCase()
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

    svg = dimple.newSvg("#grafico",width,height)
    data = dimple.filterData(data, "distrito", distrito_selec);
    data = dimple.filterData(data, "tipo", tipo_select);
    data = dimple.filterData(data, "faixa", faixas);

    var myChart = new dimple.chart(svg, data);

    myChart.setBounds(margins.left, margins.top, width - margins.right, height - margins.bottom);
    var x = myChart.addCategoryAxis("x", "faixa");

    var ordem_faixas = acha_ordem(faixas)
    x.addOrderRule(ordem_faixas)

    var y = myChart.addMeasureAxis("y", "porcentual");

    y.title = 'Porcentual de imóveis em cada faixa de valor'
    x.title = ''

    var s = myChart.addSeries("faixa", dimple.plot.bar);

      // Handle the hover event - overriding the default behaviour
      s.addEventHandler("mouseover", onHover);
      // Handle the leave event - overriding the default behaviour
      s.addEventHandler("mouseleave", onLeave);

    //myChart.assignColor("TOTAL","#007CC0")

    faixas.forEach(function (d) {
        myChart.assignColor(d,"#A11217")
    })

    myChart.draw();
    window.dados_filtrados = data;
    window.grafico = myChart

    //deixa só algumas labels
    $(".dimple-axis-x").find('text').each(function (d) {
        if (deixar_labels.indexOf($(this).text()) == -1) {
            $(this).remove()
        }
    })

    //agora montamos um array de posições ao longo do svg e qual barra é a mais próxima dela
    //vamos usar esse array na hora que passarmos o mouse em cima, para descobrir em que barra estamos
    window.posicoes = {'pos':[],'faixa':[]}
    for (var f in faixas) {
        var pos = x._scale(faixas[f]);
        posicoes['pos'].push(pos);
        posicoes['faixa'].push(faixas[f]);
    }

    //retangulo transparente de overlay para o mouseover
    svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", onHover)
      .on("mouseout", onLeave)
      .on("mousemove", onHover);

    //linha transparente para tbm o mouseover
    vertical = svg.append("svg:line")
        .attr("x1", 0)
        .attr("y1", 10)
        .attr("x2", 0)
        .attr("y2", height-55)
        .attr("class", "linha_hover")
        .style({
            "stroke": "#000000",
            "stroke-dasharray": "4",
            "stroke-width": "1",
            "stroke-opacity": "0.8"
        })

        .style("opacity", "0");
}

function onHover(e) {
    var pos = d3.mouse(this)[0];
    //se estiver dentro da área do gráfico
    if (pos >= posicoes["pos"][0]) {
        //achamos a faixa que bate com o array de posicoes e faixas que já calculamos
        var index = posicoes["pos"].indexOf(closest(pos,posicoes["pos"]))
        var faixa = posicoes["faixa"][index]

        //montamos a string para o html da barra de informações
        var caro_barato = calcula_mais_menos(distrito_selec,desconserta_tipo(tipo_select),faixa);
        var perc;
        if (caro_barato['caro_perc'] < 50) {
            var perc = caro_barato['caro_perc']+"% mais caros</b> dessa região"
        } else {
            var perc = caro_barato['barato_perc']+"% mais baratos</b> dessa região"
        }
        $('#info_barra').html('<p class="well well-sm">Os imóveis <b>'+traduz_faixa(faixa) + "</b> estão entre os <b>" + perc+"</p>")

        //checamos se existe uma linha já para só a movermos
       mousex = d3.mouse(this);
       mousex = mousex[0] + 5;
       vertical.style("opacity", 1)
       vertical.attr("x1", mousex)
       vertical.attr("x2", mousex)
    }
}

function onLeave(e) {
    $('#info_barra').html('')
   vertical.style("opacity",0)
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

function cria_linha() {
    //deleta anteriores
    $('.linha_imovel').remove();

    //acha a coordenada x para a reta, de acordo com a faixa do valor
    var faixa = acha_faixa(valor_select)

    var pos_x = $('.dimple-'+faixa).attr('x')
    var myLine = svg.append("svg:line")
        .attr("x1", pos_x)
        .attr("y1", 10)
        .attr("x2", pos_x)
        .attr("y2", height-55)
        .attr("class", "linha_imovel")
        .style("stroke", "rgb(6,120,155)")
        .style({
            "stroke": "#000000",
            "stroke-dasharray": "5.5",
            "stroke-width": "4",
            "stroke-opacity": "0.5"
        })
        .style("stroke", "#000000")
        .style("opacity", "#0.5")
        .on("mouseover", function(d) {
        div.transition()
            .duration(0)
            .style("opacity", 1)
        div.html("Posição do seu imóvel")
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY) + "px")
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(1500)
                .style("opacity", 0);
        });
}

function calcula_mais_menos(distrito,tipo,faixa) {
    var total = 0
    var baratos_temp = 0
    var caros_temp = 0
    faixa = parseInt(faixa)
    for (var faixa_temp in dados[distrito][tipo]) {
        if (faixa_temp != 'TOTAL') {
            faixa_temp = parseInt(faixa_temp)
            total += dados[distrito][tipo][faixa_temp]
            if (faixa_temp < faixa) {
                baratos_temp += dados[distrito][tipo][faixa_temp]
            } else if ((faixa_temp > faixa) && (faixa_temp != 'TOTAL')){
                caros_temp += dados[distrito][tipo][faixa_temp]
            }
        }
    }
    var esta_faixa = total - baratos_temp - caros_temp;

    var saida = {}
    saida["barato_abs"] = baratos_temp;
    saida["caro_abs"] = caros_temp;
    saida["barato_perc"] = parseInt(10000*(baratos_temp+esta_faixa)/total)/100;
    saida["caro_perc"] = parseInt(10000*(caros_temp+esta_faixa)/total)/100;
    return saida
}

function atualiza_textos() {
    if (valor_select) {
        var tipo_temp = traduz_tipo(tipo_select)
        var tipo = arruma_tipo(tipo_select)
        var faixa = acha_faixa(valor_select)
        var distrito = traduz_distrito(distrito_selec)

        if (faixa == "25000") {
            var num_temp = 0
            for (var faixa_temp in dados[distrito_selec][tipo]) {
                if ((faixa_temp != faixa) && (faixa_temp != 'TOTAL')) {
                    num_temp += dados[distrito_selec][tipo][faixa_temp]
                }
            }
            var caro_barato = calcula_mais_menos(distrito_selec,tipo,faixa)
            var texto = '<p id="texto"> Há pelo menos <b>'+numero_com_pontos(num_temp) +' '+tipo_temp+'</b> mais caros que o seu '

        } else if (faixa == "10000000000") {
            var num_temp = 0
            for (var faixa_temp in dados[distrito_selec][tipo]) {
                if ((faixa_temp != faixa) && (faixa_temp != 'TOTAL')) {
                    num_temp += dados[distrito_selec][tipo][faixa_temp]
                }
            }
            var caro_barato = calcula_mais_menos(distrito_selec,tipo,faixa)
            var texto = 'Há pelo menos <b>'+numero_com_pontos(num_temp) +' '+tipo_temp+'</b> mais baratos que o seu '

        } else {
            var caro_barato = calcula_mais_menos(distrito_selec,tipo,faixa)
            var texto = 'Há pelo menos <b>'+numero_com_pontos(caro_barato['barato_abs']) +' '+tipo_temp+'</b> mais baratos que o seu e <b>'+ numero_com_pontos(caro_barato['caro_abs']) +'</b> mais caros em '
        }

        var dados_temp = dimple.filterData(dados_filtrados,"faixa",faixa)
        dados_temp = dimple.filterData(dados_temp,"distrito",distrito_selec)

        texto += '<b>' + distrito +"</b>. Os imóveis nesta faixa de valor, <b>" + traduz_faixa(faixa).toLowerCase().replace('r$','R$').replace('r$','R$') +"</b>, estão entre os <b>"

        var perc;

        if (caro_barato['caro_perc'] < 50) {
            perc = caro_barato['caro_perc']+"%</b> mais caros dessa região.</p>"
        } else {
            perc = caro_barato['barato_perc']+"%</b> mais baratos dessa região.</p>"
        }
        texto += perc;

        $("#texto").html(texto)
    }
}
iniciar()

