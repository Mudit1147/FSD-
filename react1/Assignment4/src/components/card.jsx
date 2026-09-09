import React from 'react'

const card = () => {
  return (
    <div>
      <div style={{border:'2px solid black',height:'250px',width:'200px'}}>
        <h1>Pizza</h1>
        <p><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_4aGn1VO584EPbMq-rpavYLrYDRt71DqO9uQioHpGyQ&s=10" alt="" height={'100px'} width={"100px"}></img></p>   
        <h2>PRICE: 500</h2>  
      </div>
      <div style={{border:'2px solid black',height:'250px',width:'200px'}}>
        <h1>Pizza</h1>
        <p><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_4aGn1VO584EPbMq-rpavYLrYDRt71DqO9uQioHpGyQ&s=10" alt="" height={'100px'} width={"100px"}></img></p>   
        <h2>PRICE: 100</h2>  
      </div>
    </div>
  )
}

export default card