import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Badge,
  Pagination,
  PaginationItem,
  PaginationLink,
  Alert,
  Spinner,
  Container
} from "reactstrap";
import {
  useTable,
  usePagination,
  useGlobalFilter,
  useSortBy,
} from "react-table";
import { API_WEB_URLS } from "../../constants/constAPI";
import { useDispatch } from "react-redux";
import { Fn_FillListData, Fn_DeleteData } from "../../store/Functions";
import { useNavigate } from "react-router-dom";
import toastr from "toastr";
import "toastr/build/toastr.css";

const PageList_TransportMaster = () => {
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const rtPage_Add = "/AddTransport";
  const rtPage_Edit = "/EditTransport";
  const API_URL = API_WEB_URLS.MASTER + "/0/token/TransportMaster";
  const API_URL_Delete = API_WEB_URLS.MASTER + "/0/token/DeleteTransportMaster";

  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {},
    OtherDataScore: [],
    isProgress: true,
  });

  const fetchData = async () => {
    setLoading(true);
    await Fn_FillListData(dispatch, setGridData, "gridData", API_URL + "/Id/0");
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dispatch, API_URL]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const btnAddOnClick = () => {
    navigate(rtPage_Add, { state: { Id: 0 } });
  };

  const btnEditOnClick = (Id) => {
    navigate(rtPage_Edit, { state: { Id } });
  };

  const btnDeleteOnClick = async (Id) => {
    try {
      const response = await Fn_DeleteData(dispatch, setState, Id, `${API_URL_Delete}`, true);
      const msg = response?.data?.message || response?.message || "";
      if (response && response.status === 200 && (msg.toLowerCase().includes("record deleted") || msg.toLowerCase().includes("deleted"))) {
        toastr.success("Delete success");
        await fetchData();
      }
    } catch (e) {}
  };

  const data = useMemo(() => gridData || [], [gridData]);

  const columns = useMemo(
    () => [
      {
        Header: "Sr No",
        accessor: (row, i) => i + 1,
        disableSortBy: true,
        Cell: ({ value }) => (
          <div className="d-flex align-items-center">
            <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3">
              <span className="text-primary fw-semibold">{value}</span>
            </div>
          </div>
        ),
      },
      {
        Header: "Tank",
        accessor: "Tank",
        Cell: ({ value }) => (
          <div className="d-flex align-items-center">
            <div className="avatar-sm bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3">
              <i className="fas fa-gas-pump text-warning"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-semibold text-dark">{value}</h6>
              <small className="text-muted">Tank Number</small>
            </div>
          </div>
        ),
      },
      {
        Header: "Transport",
        accessor: "Transport",
        Cell: ({ value }) => (
          <div className="d-flex align-items-center">
            <div className="avatar-sm bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3">
              <i className="fas fa-truck text-info"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-semibold text-dark">{value}</h6>
              <small className="text-muted">Transport Name</small>
            </div>
          </div>
        ),
      },
      {
        Header: "Actions",
        accessor: "Id",
        disableSortBy: true,
        Cell: ({ value }) => (
          <div className="d-flex gap-2 justify-content-center">
            <Button
              color="primary"
              size="sm"
              onClick={() => btnEditOnClick(value)}
              className="px-3 py-1"
              style={{
                borderRadius: '6px',
                transition: 'all 0.3s ease'
              }}
            >
              <i className="fas fa-edit me-1"></i>
              Edit
            </Button>
            <Button
              color="danger"
              size="sm"
              onClick={() => btnDeleteOnClick(value)}
              className="px-3 py-1"
              style={{
                borderRadius: '6px',
                transition: 'all 0.3s ease'
              }}
            >
              <i className="fas fa-trash me-1"></i>
              Delete
            </Button>
          </div>
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

  const renderPagination = () => {
    const paginationItems = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, pageIndex - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pageCount - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    // Previous button
    paginationItems.push(
      <PaginationItem key="prev" disabled={!canPreviousPage}>
        <PaginationLink onClick={() => previousPage()} href="#">
          <i className="fas fa-chevron-left"></i>
        </PaginationLink>
      </PaginationItem>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <PaginationItem key={i} active={i === pageIndex}>
          <PaginationLink onClick={() => gotoPage(i)} href="#">
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    paginationItems.push(
      <PaginationItem key="next" disabled={!canNextPage}>
        <PaginationLink onClick={() => nextPage()} href="#">
          <i className="fas fa-chevron-right"></i>
        </PaginationLink>
      </PaginationItem>
    );

    return paginationItems;
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="text-center">
              <Spinner color="primary" size="lg" className="mb-3">
                Loading...
              </Spinner>
              <p className="text-muted">Loading transport data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transport-list-wrap">
      <style>{`
        @media (min-width: 769px) {
          .transport-list-wrap .container-fluid { padding-top: 3rem !important; }
        }
        @media (max-width: 768px) {
          .transport-list-wrap .container-fluid { padding-top: 1rem !important; }
        }
      `}</style>
      <div className="container-fluid">
        {/* Main Content Card */}
        <Row>
          <Col lg="12">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-primary text-white py-3">
                <h5 className="mb-0 fw-semibold">
                  <i className="fas fa-list me-2"></i>
                  Transport List
                </h5>
              </CardHeader>
              <CardBody className="p-4">
                {/* Search Section */}
                <Row className="mb-4 g-2">
                  <Col xs="8" sm="8" md="8" lg="6">
                    <div className="search-box position-relative">
                      <Input
                        type="text"
                        className="form-control border-2"
                        placeholder="Search..."
                        value={globalFilter || ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          paddingLeft: '45px',
                          paddingRight: '10px',
                          borderColor: '#e9ecef',
                          transition: 'all 0.3s ease',
                          fontSize: '13px',
                          height: '38px'
                        }}
                      />
                      <i 
                        className="fas fa-search position-absolute"
                        style={{
                          left: '15px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          zIndex: 10,
                          fontSize: '14px'
                        }}
                      ></i>
                    </div>
                  </Col>
                  <Col xs="4" sm="4" md="4" lg="6" className="d-flex align-items-center">
                    <Button
                      color="primary"
                      size="sm"
                      onClick={btnAddOnClick}
                      className="fw-semibold py-1 px-2 w-100 d-flex align-items-center justify-content-center"
                      style={{
                        borderRadius: '4px',
                        fontSize: '11px',
                        lineHeight: 1.2,
                        maxWidth: '120px',
                        height: '38px'
                      }}
                    >
                      + Add New
                    </Button>
                  </Col>
                </Row>

                {/* Data Table */}
                {data.length === 0 ? (
                  <Alert color="info" className="text-center">
                    <i className="fas fa-info-circle me-2"></i>
                    No transport data available.
                  </Alert>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table {...getTableProps()} className="table table-hover mb-0">
                        <thead className="table-light">
                          {headerGroups.map((headerGroup, headerGroupIndex) => (
                            <tr {...headerGroup.getHeaderGroupProps()} key={headerGroupIndex}>
                              {headerGroup.headers.map((column, columnIndex) => (
                                <th 
                                  {...column.getHeaderProps(column.getSortByToggleProps())} 
                                  key={columnIndex}
                                  className="border-0 fw-semibold text-dark"
                                  style={{ cursor: column.canSort ? 'pointer' : 'default' }}
                                >
                                  <div className="d-flex align-items-center">
                                    {column.render("Header")}
                                    {column.canSort && (
                                      <span className="ms-2">
                                        {column.isSorted ? (
                                          column.isSortedDesc ? (
                                            <i className="fas fa-sort-down text-primary"></i>
                                          ) : (
                                            <i className="fas fa-sort-up text-primary"></i>
                                          )
                                        ) : (
                                          <i className="fas fa-sort text-muted"></i>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          ))}
                        </thead>
                        <tbody {...getTableBodyProps()}>
                          {page.map((row, rowIndex) => {
                            prepareRow(row);
                            return (
                              <tr {...row.getRowProps()} key={rowIndex} className="align-middle">
                                {row.cells.map((cell, cellIndex) => (
                                  <td {...cell.getCellProps()} key={cellIndex} className="border-0">
                                    {cell.render("Cell")}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination and Page Size Controls */}
                    {pageCount > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-4">
                        <div className="d-flex align-items-center gap-3">
                          <div className="text-muted">
                            Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, data.length)} of {data.length} transport records
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="text-muted">Show:</span>
                            <select
                              value={pageSize}
                              onChange={(e) => setPageSize(Number(e.target.value))}
                              className="form-select form-select-sm"
                              style={{ width: 'auto' }}
                            >
                              {[10, 20, 30, 40, 50].map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <Pagination className="mb-0">
                          {renderPagination()}
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PageList_TransportMaster;

