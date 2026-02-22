import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Button, FormControl, Table, Spinner } from "react-bootstrap";
import {
  useTable,
  usePagination,
  useGlobalFilter,
  useSortBy,
} from "react-table";
import { API_WEB_URLS } from "../../constants/constAPI";
import { useDispatch } from "react-redux";
import { Fn_FillListData } from "../../store/Functions";
import { useNavigate } from "react-router-dom";
import { Container } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const PageList_MCQMasterH = () => {
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const breadCrumbTitle = "MCQ H Master";
  const breadcrumbItem = "MCQ H Master";
  const rtPage_Add = "/AddCourseH";
  const rtPage_Edit = "/EditCourseH";
  const API_URL = API_WEB_URLS.MASTER + "/0/token/CourseMasterH";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
       Fn_FillListData(dispatch, setGridData, "gridData", API_URL + "/Id/0");
      setLoading(false);
    };

    fetchData();
  }, [dispatch, API_URL]);

  const btnAddOnClick = () => {
    
     navigate(rtPage_Add, { state: { Id: 0 } });
  };

  const btnEditOnClick = (Id) => {
  
    navigate(rtPage_Edit, { state: { Id } });
  };

  const btnDeleteOnClick = (formData) => {
    // Delete item logic
  };

  const data = useMemo(() => gridData || [], [gridData]);

  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "Name",
      },
     
      {
        Header: "Edit",
        Cell: ({ row }) => (
          <Button
            variant="danger"
            size="sm"
            onClick={() => btnEditOnClick(row.original.Id)}
          >
            Edit
          </Button>
        ),
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="page-content">
      <style>{`
        @media (min-width: 769px) {
          .page-content .container-fluid {
            padding-top: 3rem !important;
          }
        }
        @media (max-width: 768px) {
          .page-content .container-fluid {
            padding-top: 1rem !important;
          }
        }
      `}</style>
    <Container fluid={true}>

      <Row className="mb-2">
        <Col md="4">
          <FormControl
            type="text"
            placeholder="Search"
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="mb-2"
          />
        </Col>
        <Col md="4">
          <Button
            type="button"
            onClick={btnAddOnClick}
            variant="success"
            className="mb-2"
          >
            Add New
          </Button>
        </Col>
      </Row>

      <Table {...getTableProps()} responsive bordered striped>
  <thead>
    {headerGroups.map((headerGroup, headerGroupIndex) => (
      <tr {...headerGroup.getHeaderGroupProps()} key={headerGroupIndex}>
        {headerGroup.headers.map((column, columnIndex) => (
          <th
            {...column.getHeaderProps(column.getSortByToggleProps())}
            key={columnIndex}
          >
            {column.render("Header")}
            <span>
              {column.isSorted
                ? column.isSortedDesc
                  ? " 🔽"
                  : " 🔼"
                : ""}
            </span>
          </th>
        ))}
      </tr>
    ))}
  </thead>
  <tbody {...getTableBodyProps()}>
    {page.map((row, rowIndex) => {
      prepareRow(row);
      return (
        <tr {...row.getRowProps()} key={rowIndex}>
          {row.cells.map((cell, cellIndex) => (
            <td {...cell.getCellProps()} key={cellIndex}>
              {cell.render("Cell")}
            </td>
          ))}
        </tr>
      );
    })}
  </tbody>
</Table>


      <Row className="mt-2">
        <Col>
          <Button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
            {"<<"}
          </Button>{" "}
          <Button onClick={() => previousPage()} disabled={!canPreviousPage}>
            {"<"}
          </Button>{" "}
          <Button onClick={() => nextPage()} disabled={!canNextPage}>
            {">"}
          </Button>{" "}
          <Button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
            {">>"}
          </Button>{" "}
          <span>
            Page{" "}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{" "}
          </span>
          <span>
            | Go to page:{" "}
            <input
              type="number"
              defaultValue={pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                gotoPage(page);
              }}
              style={{ width: "100px" }}
            />
          </span>{" "}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </Col>
      </Row>
      </Container>
    </div>
  );
};

export default PageList_MCQMasterH;
