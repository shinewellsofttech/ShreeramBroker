import React, { useEffect } from 'react';
import { Table } from 'reactstrap';

const DynamicTable = ({ data, columns, rowStyling }) => {
    // Check if data array is empty
    if (data.length === 0) {
        return <p>No data available</p>;
    }

    useEffect(() => {
        console.log(data);
    }, [data]);

    return (
       <div className='m-3'>
         <Table striped bordered hover responsive>
            <thead>
                <tr>
                    {columns.map((column, index) => (
                        <th key={index}>{column}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex} style={rowStyling ? rowStyling(row) : {}}>
                        {columns.map((column, colIndex) => (
                            <td key={colIndex}>
                               {row[column]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </Table>
       </div>
    );
};

export default DynamicTable;
