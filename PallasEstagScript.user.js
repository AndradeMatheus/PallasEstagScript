// ==UserScript==
// @name         Pallas EstagScript
// @namespace    http://github.com/AndradeMatheus/PallasEstagScript/
// @version      1.8.1
// @description  Cálculo de horas pallas estagiário
// @author       AndradeMatheus - Matheus Andrade (https://github.com/AndradeMatheus)
// @contributor  lucasvsouza28 - Lucas Souza (https://github.com/lucasvsouza28)
// @copyright    2019+, AndradeMatheus (https://github.com/AndradeMatheus)
// @match        http://intranet/pallas/*
// @icon
// @homepageURL  https://github.com/AndradeMatheus/PallasEstagScript/
// @include      *github.com*
// @require      https://raw.githubusercontent.com/AndradeMatheus/PallasEstagScript/master/axios.min.js
// @require      https://raw.githubusercontent.com/AndradeMatheus/PallasEstagScript/master/axiosGmxhrAdapter.min.js
// @grant        none
// ==/UserScript==

(async function($$, axios) {
  let pallasStore;
  let holidays;
  try {
    ({ data: holidays } = await axios(
      `https://api.calendario.com.br/?json=true&ano=${new Date().getFullYear()}&estado=SP&cidade=SAO_PAULO&token=M3JyYmxwdmEuejNlQDIwbWludXRlbWFpbC5pdCZoYXNoPTIwMDA1Mg`
    ));
  } catch (err) {
    // console.log(err);
    ({ data: holidays } =  await axios('https://raw.githubusercontent.com/AndradeMatheus/PallasEstagScript/master/feriados.json'));
  }

  $$("#labelAbaModulo")[0].innerHTML = "Pallas Estagiário v1.8.1";

  $$("iframe#ifrmPai").on("load", function(e) {
    calculatePallas();
  });

  window.addEventListener(
    "load",
    function() {
      const li = $$(`              <li id="divCalcEstagio" class="liTopo li-notificacao">
                <a id="linkCalcEstagio" href="#" class="has-submenu">
                  <i id="imagemCalcEstagio" class="fa fa-refresh corFonte"></i>
                  <label id="labelCalcEstagio" class='label-icon-descricao'>RECALC PALLAS</label>
                </a>
              </li>`);

      $$(li).click(function() {
        calculatePallas(document.getElementById("diasFerias").value);
      });
      $$(".menuTopo").prepend(li);
      $$(".menuTopo").prepend(`              <li id="divFeriasEstagio" class="liTopo li-notificacao">
Dias de férias: 
                <input type="text" name="diasFerias" id="diasFerias" style="text-align:center; width: 50px; margin-top: 9px;">
              </li>`);
    },
    false
  );

  function calculatePallas(diasFerias = 0) {
    var date = new Date();
    var diasUteisHoje = date.getMonthBusinessDays(true);
    var $frm = $$("iframe#ifrmPai").contents();
    var $txtapontamentos_mes = $$("#txtapontamentos_mes", $frm);
    var $txtapontamentos_dia = $$("#txtapontamentos_dia", $frm);
    var $txtnr_horas_saldo_mes = $$("#txtnr_horas_saldo_mes", $frm);
    var $txtdt_saida_programada = $$("#txtdt_saida_programada", $frm);

    //Calcula os apontamentos do mês
    //var totalMes = "95h 9min / 168h 0min";

    var totalMes = (pallasStore && pallasStore.totalMes) || $txtapontamentos_mes.text();

    var hMes = parseInt(totalMes.split(" /")[0].split("h ")[0], 10);
    var minMes = parseInt(
      totalMes
        .split(" /")[0]
        .split("h ")[1]
        .replace("min", ""),
      10
    );
    var aux = (parseInt(totalMes.split("/ ")[1].split("h "), 10) / 8) * 6 - diasFerias * 6;
    totalMes = totalMes.split("/ ")[0];
    totalMes = `${totalMes}/ ${aux}h 0min`;

    //Calcula os apontamentos do dia
    let totalDia = (pallasStore && pallasStore.totalDia) || $txtapontamentos_dia.text();

    aux = parseInt(totalDia.split("/ ")[1].split("h "), 10) - 2;
    totalDia = totalDia.split("/ ")[0];
    totalDia = `${totalDia}/ ${aux}h 0min`;

    //Calcula o saldo do mês e a saída ideal
    const sldMes = -(diasUteisHoje * 6 - hMes) + diasFerias * 6;
    const { saida, totalSaldo } = getCalcOutput(date, sldMes, minMes);

    if (!pallasStore) {
      pallasStore = {
        totalMes: $$("#txtapontamentos_mes", $frm).text(),
        totalDia: $$("#txtapontamentos_dia", $frm).text()
      };
    }

    //Atualiza as variáveis do HTML
    $txtapontamentos_mes[0].innerHTML = totalMes;
    $txtapontamentos_dia[0].innerHTML = totalDia;
    $txtnr_horas_saldo_mes[0].innerHTML = totalSaldo;
    $txtdt_saida_programada[0].innerHTML = saida;

    return true;
  }

  /**
   * Retorna resultado do cálculo
   * @param {Data} date 
   * @param {Saldo} sldMes 
   * @param {Minutos} minMes
   * @returns   Resultado do cálculo em String
   */
  function getCalcOutput(date, sldMes, minMes){
    let totalSaldo = '';
    let saida = '';

    if (sldMes == 0 && minMes == 0) {
      totalSaldo = "ZEROU O SALDO!";      
      saida = "VAI EMBORA!!";

      alert("Hora de ir embora!");
    } else if (sldMes >= 0) {
      totalSaldo = `+${sldMes}h ${minMes}min`;
      saida = "VAI EMBORA!!";

      alert(`Cara, vai embora! Você tem ${totalSaldo.replace("+", "").replace(" ", " e ")} a mais!`);
    } else {
      minMes = minMes > 0 ? 60 - minMes : 0;
      sldMes = minMes > 0 ? sldMes + 1 : sldMes;
      totalSaldo = `-${-sldMes}h ${minMes}min`;

      if (date.getMinutes() + minMes >= 60) {
        minMes = date.getMinutes() - 60 + minMes;
        sldMes -= 1;
      } else {
        minMes = date.getMinutes() + minMes;
      }

      var passouDia = date.getHours() + Math.abs(sldMes) >= 24 ? true : false;

      saida = `${date.toLocaleDateString('pt-BR')} ${
        passouDia ? 23 : date.getHours() + Math.abs(sldMes)}:${
        passouDia ? 59 : minMes < 10 ? "0" + minMes : minMes}`;
    }

    return { saida, totalSaldo };
  }

  /**
   * Valida se é dia útil
   * @returns   true = é dia útil, false = não é dia útil
   */
  Date.prototype.isBusinessDay = function() {
    return this.getDay() % 6;
  };

  /**
   * Retorna quantidade de dias no mês
   * @returns   quantidade de dias no mês
   */
  Date.prototype.getDaysInMonth = function() {
    return new Date(this.getFullYear(), this.getMonth() + 1, 0).getDate();
  };

  /**
   * Retorna quantidade de dias úteis no mês. Se toDate = true, retorna quantidade de dias úteis até o hoje
   * @returns   Quantidade de dias úteis no mês
   */
  Date.prototype.getMonthBusinessDays = function(toDate = false) {
    var year = this.getFullYear();
    var month = this.getMonth();
    var today = new Date();

    // obtem quantidade de dias no mês
    var daysInMonth = this.getDaysInMonth();
    var ret = [];

    for (var i = 0; i < daysInMonth; i++) {
      var tmp = new Date(year, month, i + 1);

      // valida se é um dia útil
      if (tmp.isBusinessDay()) {
        // valida se deve calcular somente até o dia atual
        if (toDate && i >= today.getDate()) break;
        
        // valida se é feriado
        if (tmp.isHoliday()) continue;
        ret.push(i);
      }
    }
    return ret.length;
  };

  /**
   * Verifica se é feriado
   * @returns True = É feriado, False = Não é feriado
   */
  Date.prototype.isHoliday = function() {
    const isHoliday = holidays.filter(h => h.date == this.toLocaleDateString('pt-BR') && (h.type_code == 1 || h.type_code == 3));    

    if (isHoliday.length) return true;

    return false;
  }
})(window.jQuery, axios);
