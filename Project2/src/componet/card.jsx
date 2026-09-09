import React from 'react'

const card = () => {
  return (
    <div>
      <div style={{border:'2px solid red', width:'300px', height:'300px', margin:'auto'}}>
        <h1>My Car</h1>
        <p><img src="https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bHV4dXJ5JTIwY2FyfGVufDB8fDB8fHww" alt="" height={'100px'} width={'200px'} /></p>
        <h2> Car Name: Alto 800</h2>
        <h2>price: $5,000</h2>
      </div>
    </div>
  )
}

export default card
