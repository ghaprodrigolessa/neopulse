/* eslint eqeqeq: "off" */
import React, { useContext, useEffect } from 'react';
import Context from '../Context';
import axios from 'axios'
import moment from 'moment';
import logo from '../images/paulodetarso_logo.png'
import { Font } from '@react-pdf/renderer';
import fontbold from '../fonts/Roboto-Bold.ttf';
import EvolucaoSelecaoMultipla from '../components/EvolucaoSelecaoMultipla';
import EvolucaoSelecaoSimples from '../components/EvolucaoSelecaoSimples';
import imprimir from '../images/imprimir.svg';

import EvolucaoTexto from '../components/EvolucaoTexto';

// viewdocumento 111(form), 112(pdf), 113(busy).
function AnamneseFisio() {

  // recuperando estados globais (Context.API).
  const {
    statusdocumento,
    printdocumento, setprintdocumento,
    idatendimento,
    nomeunidade, box,
    datadocumento,
    nomepaciente, nomemae, dn,
    nomeusuario, conselho,
    tipodocumento,
    camposopcoes, setcamposopcoes,
    camposvalores, setcamposvalores,
    registros_atuais, setregistros_atuais,
    registros_antigos, setregistros_antigos,
    idcampo, setidcampo,
    iddocumento,
    idselecteddocumento,
    setstatusdocumento,
    idpaciente,
    selectedcategoria,
  } = useContext(Context);

  let camposusados = [
    4]

  useEffect(() => {
    if (tipodocumento == 'ANAMNESE - CREFITO' && conselho == 'CREFITO') {
      axios.get('http://192.168.100.6:3333/pool_evolucoes_valores/').then((response) => {
        var x = [0, 1];
        x = response.data.rows;
        setregistros_antigos(x.filter(item => item.evolucao == 'ANAMNESE - CREFITO' && item.idevolucao < iddocumento));
        setcamposvalores(x.rows);
        if (statusdocumento == -2) {
          console.log('COPIA VALOR DA EVOLUÇÃO SELECIONADA');
          camposusados.map(item => x.filter(valor => valor.idcampo == item && valor.idevolucao == idselecteddocumento).map(item => copiaValor(item)));
          setTimeout(() => {
            axios.get('http://192.168.100.6:3333/pool_evolucoes_valores/').then((response) => {
              var x = [0, 1];
              x = response.data.rows;
              setregistros_atuais(x.filter(item => item.idevolucao == iddocumento));
              setstatusdocumento(0);
            });
          }, 1000);
        } else if (statusdocumento == -1 && iddocumento != 0) {
          console.log('CRIA VALOR NOVO');
          if (registros_antigos.length > 0) {
            var lastid = null;
            var htmlghapevolucoes = process.env.REACT_APP_API_CLONE_EVOLUCOES;
            axios.get(htmlghapevolucoes + idpaciente).then((response) => {
              var x = [0, 1];
              var y = [0, 1];
              x = response.data;
              y = x.rows;
              var lastevolution = y.sort((a, b) => moment(a.data) > moment(b.data) ? 1 : -1).filter(item => item.conselho == conselho && item.evolucao == tipodocumento).slice(-1);
              lastid = lastevolution.map(item => item.id).pop();
              console.log(lastid);
              console.log('ANTIGOS!')
              camposusados.map(item => registros_antigos.filter(valor => valor.idcampo == item && valor.idevolucao == lastid - 1).map(item => insertValor(item, item.idcampo, item.idopcao, item.valor)));
            });
          } else {
            camposusados.map(item => camposopcoes.filter(valor => valor.idcampo == item).map(item => insertValor(item, item.idcampo, item.id, null)));
          }
          setTimeout(() => {
            axios.get('http://192.168.100.6:3333/pool_evolucoes_valores/').then((response) => {
              var x = [0, 1];
              x = response.data.rows;
              setregistros_atuais(x.filter(item => item.idevolucao == iddocumento));
              setstatusdocumento(0);
            });
          }, 1000);
        } else if (statusdocumento > -1) {
          setregistros_atuais([]);
          console.log('RECUPERANDO VALOR DO DOCUMENTO');
          axios.get('http://192.168.100.6:3333/pool_evolucoes_valores/').then((response) => {
            var x = [0, 1];
            x = response.data.rows;
            setregistros_atuais(x.filter(item => item.idevolucao == iddocumento));
          });
        }
      });
    }
  }, [statusdocumento, tipodocumento, selectedcategoria]);

  const insertValor = (item, idcampo, idopcao, valor) => {
    var obj = {
      idpct: idpaciente,
      idatendimento: idatendimento,
      data: moment(),
      idcampo: idcampo,
      idopcao: idopcao,
      opcao: item.opcao,
      valor: valor,
      idevolucao: iddocumento
    }
    console.log(obj);
    axios.post('http://192.168.100.6:3333/insert_evolucao_valor', obj).then(() => {
    });
  }

  const copiaValor = (item) => {
    // inserindo registro.  
    var obj = {
      idpct: idpaciente,
      idatendimento: idatendimento,
      data: moment(),
      idcampo: item.idcampo,
      idopcao: item.idopcao,
      opcao: item.opcao,
      valor: item.valor,
      idevolucao: iddocumento // id do documento recém-criado.
    }
    console.log(obj);
    axios.post('http://192.168.100.6:3333/insert_evolucao_valor', obj).then(() => {
      // loadCamposValores();
    });
  }

  function Form() {
    return (
      <div className="scroll"
        id="FORMULÁRIO"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          width: '70vw',
          height: '50vh',
          scrollBehavior: 'smooth',
          paddingRight: 10,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          alignSelf: 'center',
          opacity: statusdocumento == 1 || statusdocumento == 2 ? 0.7 : 1,
          position: 'relative',
          fontFamily: 'Helvetica',
          pageBreakInside: 'avoid',
        }}
      >
        <button id="print-button"
          className="green-button noprint"
          title="IMPRIMIR EVOLUÇÃO."
          onClick={() => { printDiv() }}
          style={{
            display: printdocumento == 1 ? 'none' : 'flex',
            position: 'sticky',
            top: 0, left: 0,
            marginTop: 0,
            width: 50, minWidth: 50,
            height: 50, minHeight: 50,
            alignSelf: 'flex-end',
            zIndex: 20
          }}
        >
          <img
            alt=""
            src={imprimir}
            style={{
              margin: 10,
              height: 30,
              width: 30,
            }}
          ></img>
        </button>
        <div
          style={{
            pointerEvents: statusdocumento == 1 || statusdocumento == 2 ? 'none' : 'auto',
            fontFamily: 'Helvetica',
          }}>
          <div fixed={true} id="CABEÇALHO" style={{
            display: printdocumento == 1 ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 2.5,
            borderColor: 'black',
            borderWidth: 1,
            borderRadius: 5,
            fontFamily: 'Helvetica',
            margin: 2.5,
            marginTop: 5,
            height: 130,
          }}>
            <div id='logo + nome do hospital + id do documento'
              style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>
                <img id="logo"
                  alt=""
                  src={logo}
                  style={{
                    margin: 0,
                    width: 80, height: 60,
                    alignSelf: 'center',
                  }}
                ></img>
                <div id="nome do hospital"
                  style={{ fontSize: 18, textAlign: 'center', padding: 20, fontWeight: 'bold', alignSelf: 'center' }}>
                  {'CLÍNICA DE TRANSIÇÃO PAULO DE TARSO'}
                </div>
              </div>
              <div id="id do documento"
                style={{
                  display: 'flex',
                  flexDirection: 'column', justifyContent: 'center', padding: 5, backgroundColor: '#f2f2f2', borderRadius: 5, margin: 5, alignSelf: 'center'
                }}>
                <div style={{ fontSize: 10, margin: 2.5, marginTop: 0, textAlign: 'right' }}>{'ATENDIMENTO: ' + idatendimento}</div>
                <div style={{ fontSize: 10, margin: 2.5, textAlign: 'right' }}>{nomeunidade + ' - ' + box}</div>
                <div style={{ fontSize: 10, margin: 2.5, marginBottom: 0, textAlign: 'right' }}>{'EMITIDO EM: ' + moment(datadocumento).format('DD/MM/YYYY - HH:mm')}</div>
              </div>
            </div>
            <div id="nome do paciente + id do paciente">
              <div style={{ fontSize: 14, margin: 5, fontWeight: 'bold' }}>{'PACIENTE: ' + nomepaciente}</div>
              <div style={{ fontSize: 10, margin: 5, marginTop: 0, marginBottom: 0 }}>{'MÃE: ' + nomemae}</div>
              <div style={{ flexDirection: 'row', margin: 5, marginTop: 2.5 }}>
                <div style={{ fontSize: 10, margin: 0 }}>{'DN: ' + dn + ' (' + moment().diff(moment(dn, 'DD/MM/YYYY'), 'years') + ' ANOS)'}</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 14, textAlign: 'center', padding: 10, fontWeight: 'bold', alignSelf: 'center' }}>AVALIAÇÃO INICIAL</div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
            <EvolucaoSelecaoSimples idcampo={4} campo={'DOR'} obrigatorio={1}></EvolucaoSelecaoSimples>

          </div>

          <div id="assinatura"
            style={{
              display: printdocumento == 1 ? 'flex' : 'none',
              flexDirection: 'column',
              justifyContent: 'center', alignSelf: 'center', width: '100%',
              alignContent: 'center', textAlign: 'center',
              marginTop: 20,
            }}>
            <div style={{ fontSize: 10, margin: 5 }}>{'DOCUMENTO ASSINADO DIGITALMENTE POR:'}</div>
            <div style={{ fontSize: 14, margin: 2.5, fontWeight: 'bold' }}>{nomeusuario}</div>
            <div style={{ fontSize: 14, margin: 2.5, fontWeight: 'bold' }}>{conselho}</div>
          </div>

        </div>
      </div >
    )
  };

  function printDiv() {
    setprintdocumento(1);
    setTimeout(() => {
      var divContents = document.getElementById("FORMULÁRIO").innerHTML;
      var a = window.open();
      a.document.write('<html>');
      a.document.write(divContents);
      a.document.write('</body></html>');
      a.print();
      a.close();
      setprintdocumento(0);
    }, 1000);
  }

  // renderização dos componentes.
  return (
    <div style={{ display: tipodocumento == 'ANAMNESE - CREFITO' && conselho == 'CREFITO' && statusdocumento != null ? 'flex' : 'none' }}>
      <Form></Form>
    </div>
  )
}

export default AnamneseFisio;