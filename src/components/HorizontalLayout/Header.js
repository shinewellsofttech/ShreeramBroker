import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";

// Redux Store
import { showRightSidebarAction, toggleLeftmenu } from "../../store/actions";

//i18n
import { withTranslation } from "react-i18next";

const Header = props => {
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("authUser");
    // Redirect to logout page or home
    window.location.href = "/logout";
  };

  return (
    <React.Fragment>
      <header id="page-topbar">
        <div className="navbar-header">
          <div className="d-flex">
            <button
              type="button"
              className="btn btn-sm px-3 font-size-16 d-lg-none header-item"
              data-toggle="collapse"
              onClick={() => {
                props.toggleLeftmenu(!props.leftMenu);
              }}
              data-target="#topnav-menu-content"
            >
              <i className="fa fa-fw fa-bars" />
            </button>
          </div>

          

          <div className="d-flex">
            <button
              type="button"
              className="btn header-item btn-danger"
              onClick={handleLogout}
            >
              <i className="bx bx-power-off font-size-16 align-middle me-1" />
              <span className="d-none d-xl-inline-block">Logout</span>
            </button>
          </div>
        </div>
      </header>
    </React.Fragment>
  );
};

Header.propTypes = {
  leftMenu: PropTypes.any,
  showRightSidebar: PropTypes.any,
  showRightSidebarAction: PropTypes.func,
  t: PropTypes.any,
  toggleLeftmenu: PropTypes.func
};

const mapStatetoProps = state => {
  const { layoutType, showRightSidebar, leftMenu } = state.Layout;
  return { layoutType, showRightSidebar, leftMenu };
};

export default connect(mapStatetoProps, {
  showRightSidebarAction,
  toggleLeftmenu,
})(withTranslation()(Header));
