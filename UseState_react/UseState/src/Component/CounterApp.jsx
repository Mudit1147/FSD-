import React, { useState } from 'react'

const CounterApp = () => {
    
    // useState is used to change state of any fuctional components in react 
    // Datatype[variable_name, setFunction(Function name should be same as var_name)] = useState(initial_value)
    
    const[count,setCount]=useState(0);

    function inc(){
        // Calling function of useState and telling us the operation that we have to do on that variable
        setCount(count+1);
    }

    function dec(){
        setCount(count-1);
    }

  return (
    <div style={{border:"2px solid red",height:"300px",width:"300px"}}>

      <h1>CounterApp</h1>
      <button onClick={inc}>ADD +</button>
      <br/>
      <span>{count}</span>
      <br/>
      <button onClick={dec}>SUB -</button>
    </div>
  )
}

export default CounterApp