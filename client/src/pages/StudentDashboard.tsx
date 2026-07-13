import React from 'react';

export default function StudentDashboard() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      textAlign: 'center',
      padding: '20px'
    }}>
      <img 
        src="https://media.giphy.com/media/3oEjI6SIIQAQ3Ym0j6/giphy.gif" 
        alt="Carregando..." 
        style={{
          width: '150px',
          height: '150px',
          marginBottom: '20px'
        }}
      />
      <h1 style={{
        fontSize: '2em',
        color: '#333',
        marginBottom: '10px'
      }}>
        Aguarde um momento!
      </h1>
      <p style={{
        fontSize: '1.2em',
        color: '#555'
      }}>
        Estamos lançando as notas e atualizando o sistema. Em breve, todas as informações estarão disponíveis aqui.
      </p>
      <p style={{
        fontSize: '1em',
        color: '#777',
        marginTop: '20px'
      }}>
        Obrigado pela sua paciência!
      </p>
    </div>
  );
}
