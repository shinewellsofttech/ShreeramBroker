// MyFunctionalComponent.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { API_WEB_URLS } from '../../constants/constAPI';
import { Fn_FillListData } from '../../store/Functions';

const Ganesh = () => {
    const API_URL = API_WEB_URLS.MASTER + "/0/token/City/Id/0"; 
    const [state, setState] = useState({
        productData: [],
        OtherDataScore: [],
        isProgress: true,
        rows: []
    });

    const dispatch = useDispatch();

    const handleButtonClick = () => {
        
        Fn_FillListData(dispatch, setState, 'productData', API_URL);
    };

    return (
        <div className='page-content'>
            <button onClick={handleButtonClick}>Load Data</button>
            {/* Render your component UI based on state here */}
            {state.isProgress ? <div>Loading...</div> : <div>Data loaded</div>}
            {/* Example rendering the productData grid */}
            <pre>{JSON.stringify(state.productData, null, 2)}</pre>
        </div>
    );
};

export default Ganesh;
