// ==UserScript==
// @name         PallasEstagScript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Cálculo de horas pallas estagiário
// @author       Matheus Andrade (Pesquisa & Desenvolvimento)
// @match        http://intranet/pallas/Default.aspx?eng_padrao=s&eng_idtela=5011&
// @match        http://intranet/pallas/
// @match        http://intranet/pallas/Default.aspx?eng_trocamodulo=1&eng_idmodulo=1
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

window.addEventListener(
  "load",
  function() {
    calculatePallas();
  },
  false
);

function calculatePallas() {
  var date = new Date();
  var diasUteisMes = getDaysInMonth(date.getMonth(), date.getFullYear()).length;
  var diasUteisHoje = getDaysInMonth(date.getMonth(), date.getFullYear(), true).length + 1;

  //Calcula os apontamentos do mês
  //var totalMes = "79h 17min / 168h 0min";

  var totalMes = window
    .jQuery("iframe#ifrmPai")
    .contents()
    .find("#txtapontamentos_mes")
    .text();
  var hMes = parseInt(totalMes.split(" /")[0].split("h ")[0], 10);
  var minMes = parseInt(
    totalMes
      .split(" /")[0]
      .split("h ")[1]
      .replace("min", ""),
    10
  );
  var aux = (parseInt(totalMes.split("/ ")[1].split("h "), 10) / 8) * 6;
  totalMes = totalMes.split("/ ")[0];
  totalMes = `${totalMes}/ ${aux}h 0min`;

  //Calcula os apontamentos do dia
  var totalDia = window
    .jQuery("iframe#ifrmPai")
    .contents()
    .find("#txtapontamentos_dia")
    .text();

  aux = parseInt(totalDia.split("/ ")[1].split("h "), 10) - 2;
  totalDia = totalDia.split("/ ")[0];
  totalDia = `${totalDia}/ ${aux}h 0min`;

  //Calcula o saldo do mês e a saída ideal
  var saida = "";
  var sldMes = -(diasUteisHoje * 6 - hMes);
  var totalSaldo = "";

  if (sldMes == 0 && minMes == 0) {
    totalSaldo = "ZEROU O SALDO!";
    alert("Hora de ir embora!");
    saida = "VAI EMBORA!!";
  } else if (sldMes >= 0) {
    totalSaldo = `+${sldMes}h ${minMes}min`;
    alert(`Cara, vai embora! Você tem ${totalSaldo.replace("+", "").replace(" ", " e ")} a mais!`);
    saida = "VAI EMBORA!!";
  } else {
    minMes = minMes > 0 ? 60 - minMes : 0;
    sldMes = minMes > 0 ? sldMes + 1 : sldMes;
    totalSaldo = `${sldMes}h ${minMes}min`;

    if (date.getMinutes() + minMes >= 60) {
      minMes = date.getMinutes() - 60 + minMes;
      sldMes -= 1;
    } else {
      minMes = date.getMinutes() + minMes;
    }

    saida = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours() + Math.abs(sldMes)}:${
      minMes < 10 ? "0" + minMes : minMes
    }`;
  }

  //Atualiza as variáveis do HTML
  window
    .jQuery("iframe#ifrmPai")
    .contents()
    .find("#txtapontamentos_mes")[0].innerHTML = totalMes;
  window
    .jQuery("iframe#ifrmPai")
    .contents()
    .find("#txtapontamentos_dia")[0].innerHTML = totalDia;
  window
    .jQuery("iframe#ifrmPai")
    .contents()
    .find("#txtnr_horas_saldo_mes")[0].innerHTML = totalSaldo;
  window
    .jQuery("iframe#ifrmPai")
    .contents()
    .find("#txtdt_saida_programada")[0].innerHTML = saida;

  return true;
}

function getDaysInMonth(month, year, toDate = false) {
  month--;
  var current = new Date();
  var date = new Date(year, month, 1);
  var days = [];
  while (date.getMonth() === month) {
    var tmpDate = new Date(date);
    var weekDay = tmpDate.getDay();
    var day = tmpDate.getDate();

    if (toDate && current.getDate() < tmpDate.getDate()) break;

    if (weekDay % 6) {
      // exclui sabado e domingo
      days.push(day);
    }

    date.setDate(date.getDate() + 1);
  }

  return days;
}

/*function checkIframeLoaded() {
  // Get a handle to the iframe element
  var iframe = document.getElementById("ifrmJanela");
  var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

  // Check if loading is complete
  if (iframeDoc.readyState == "complete") {
    calculatePallas();
    return;
  }

  window.setTimeout(checkIframeLoaded, 100);
}*/
