import { useState } from 'react';

const RC_M = () => {
    const [column, setColumn] = useState(150);
    const [row, setRow] = useState(150);

    return (
        <div style={{border:"2px solid red",height:"300px",width:"300px"}}>
            <h1>RC_M</h1>
            <div>
                <img
                    src="https://media.wired.com/photos/63b8d0a771c6b526845f15a6/3:2/w_2400,h_1600,c_limit/CES-2023-PEUGEOT_INCEPTION_CONCEPT_2301CN202.jpg"
                    alt="Peugeot Inception concept car"
                    style={{width: `${column}px`, height: `${row}px`, objectFit: "cover"}}
                />
            </div>
            <button onClick={() => setRow((height) => height + 50)}>ADD Row +</button>
            <button onClick={() => setRow((height) => Math.max(50, height - 50))}>REMOVE Row -</button>
            <button onClick={() => setColumn((width) => width + 50)}>ADD Column +</button>
            <button onClick={() => setColumn((width) => Math.max(50, width - 50))}>REMOVE Column -</button>
        </div>
    );
};

export default RC_M;
