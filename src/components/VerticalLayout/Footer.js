import React from "react"
import { Container, Row, Col } from "reactstrap"
import { getCompanyName } from "constants/constAPI"

const Footer = () => {
  const companyName = getCompanyName()
  return (
    <React.Fragment>
      <footer className="footer">
        <Container fluid={true}>
          <Row>
            <Col md={6}>{new Date().getFullYear()} © {companyName}.</Col>
            <Col md={6}>
              <div className="text-sm-end d-none d-sm-block">
                Design & Develop by {companyName}
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </React.Fragment>
  )
}

export default Footer
