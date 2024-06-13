/**
 * @jest-environment jsdom
 */

import $ from "jquery";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import BillsUI from "../views/BillsUI.js";
import Bill from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import { formatList } from "../app/format.js";

// jQuery mock for modal display test
jest.mock("jquery", () => {
  const m$ = jest.fn((selector) => ({
    width: jest.fn(() => 600),
    find: jest.fn(() => ({
      html: jest.fn(),
    })),
    modal: jest.fn(),
    click: jest.fn(),
  }));
  return m$;
});

jest.mock("../app/store", () => mockStore);

global.$ = global.jQuery = $;

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      // L’icône doit posséder la classe active-icon
      expect(windowIcon.classList).toContain("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      //Ajout de la fonction utilisée pour le tri ici
      document.body.innerHTML = BillsUI({ data: formatList(bills) });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe("When I click on icon eye", () => {
      test("Then modal should be displayed", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        const bill = new Bill({
          document: document,
          onNavigate: onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleClick = jest.fn((icon) => bill.handleClickIconEye(icon));

        const iconEyeList = screen.getAllByTestId("icon-eye");
        let modal = screen.getByText("Justificatif").closest("#modaleFile");

        iconEyeList[0].addEventListener("click", () =>
          handleClick(iconEyeList[0])
        );

        //All icons dare displayed
        expect(iconEyeList.length).toEqual(bills.length);

        //Dialog is closed
        expect(modal.classList.contains("show")).toBeFalsy();
        userEvent.click(iconEyeList[0]);
        expect(handleClick).toHaveBeenCalled();
      });
    });
    describe("When I click on New Bill Button", () => {
      test("Then New Bill Page should be displayed", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        const bill = new Bill({
          document: document,
          onNavigate: onNavigate,
          store: null,
          localStorage: window.localStorage,
        });
        document.body.innerHTML = BillsUI({ data: bills });
        const handleClick = jest.fn(() => bill.handleClickNewBill());
        const buttonNewBill = screen.getByTestId("btn-new-bill");
        buttonNewBill.addEventListener("click", handleClick);

        // Url check
        expect(window.location.href).toEqual(
          "http://localhost/#employee/bills"
        );
        userEvent.click(buttonNewBill);
        expect(handleClick).toHaveBeenCalled();
      });
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches and displays bills ", async () => {
      // jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByText("Mes notes de frais"));

      const iconEyeArray = screen.getAllByTestId("icon-eye");
      const firstBillFormattedDate = screen.getByText("10 Nov. 21"); // décalage horaire du à ma timezone
      const firstBillFormattedStatus = screen.getByText("En attente");

      expect(iconEyeArray.length).toEqual(4);

      //Format correctly date and status
      expect(firstBillFormattedDate).toBeTruthy();
      expect(firstBillFormattedStatus).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
