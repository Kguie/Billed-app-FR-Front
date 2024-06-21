/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import { imageFilter } from "../app/imageFilter.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
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
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getAllByText("Envoyer une note de frais"));
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon.classList).toContain("active-icon");
    });
    describe("When I do not fill fields and I click on submit button", () => {
      test("Then It should not render Bills page", () => {
        document.body.innerHTML = NewBillUI();
        const handleSubmit = jest.fn((e) => e.preventDefault());
        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
      });
    });
    describe("When I update the invoice proof", () => {
      test("Then image file should be added", async () => {
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
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({
          document: document,
          onNavigate: onNavigate,
          store: mockStore,
          localStorage: localStorageMock,
        });

        const fileInput = screen.getByTestId("file");

        const handleUpload = jest.fn((e) => newBill.handleChangeFile(e));

        fileInput.addEventListener("change", handleUpload);

        const imageFile = new File(["invoice"], "invoice.jpeg", {
          type: "image/jpeg",
        });

        expect(imageFilter(imageFile)).toEqual(1);

        userEvent.upload(fileInput, imageFile);
        expect(handleUpload).toHaveBeenCalled();
        expect(fileInput.files[0]).toStrictEqual(imageFile);
        expect(fileInput.files).toHaveLength(1);
      });
      test("Then non image file should not be added to store", async () => {
        const blob = new Blob(["text content"], { type: "text/plain" });
        const file = new File([blob], "document.txt", { type: "text/plain" });

        expect(imageFilter(file)).toEqual(0);
      });
    });
  });
});

// Test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I fill required fields and I click on submit button", () => {
    test("Then It should render Bills page", async () => {
      document.body.innerHTML = NewBillUI();

      const expenseName = screen.getByTestId("expense-name");
      fireEvent.change(expenseName, { target: { value: "Vol test" } });
      expect(expenseName.value).toBe("Vol test");

      const datePicker = screen.getByTestId("datepicker");
      fireEvent.change(datePicker, { target: { value: "2024-01-01" } });
      expect(datePicker.value).toBe("2024-01-01");

      const amount = screen.getByTestId("amount");
      fireEvent.change(amount, { target: { value: 500 } });
      expect(amount.value).toBe("500");

      const pct = screen.getByTestId("pct");
      fireEvent.change(pct, { target: { value: 100 } });
      expect(pct.value).toBe("100");

      const fileInput = screen.getByTestId("file");
      const imageFile = new File(["invoice"], "invoice.jpeg", {
        type: "image/jpeg",
      });
      userEvent.upload(fileInput, imageFile);
      expect(fileInput.files[0]).toStrictEqual(imageFile);
      expect(fileInput.files).toHaveLength(1);

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
      const newBill = new NewBill({
        document: document,
        onNavigate: onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();

      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
    // describe("When an error occurs on API", () => {
    //   beforeEach(() => {
    //     jest.spyOn(mockStore, "bills");
    //     Object.defineProperty(window, "localStorage", {
    //       value: localStorageMock,
    //     });
    //     window.localStorage.setItem(
    //       "user",
    //       JSON.stringify({
    //         type: "Employee",
    //         email: "a@a",
    //       })
    //     );
    //     const root = document.createElement("div");
    //     root.setAttribute("id", "root");
    //     document.body.appendChild(root);
    //     router();
    //   });

    //   test("Post Bill to API and fails with 501 message error", async () => {
    //     document.body.innerHTML = NewBillUI();
    //     const expenseName = screen.getByTestId("expense-name");
    //     fireEvent.change(expenseName, { target: { value: "Vol test" } });

    //     const datePicker = screen.getByTestId("datepicker");
    //     fireEvent.change(datePicker, { target: { value: "2024-01-01" } });

    //     const amount = screen.getByTestId("amount");
    //     fireEvent.change(amount, { target: { value: 500 } });

    //     const pct = screen.getByTestId("pct");
    //     fireEvent.change(pct, { target: { value: 100 } });

    //     const fileInput = screen.getByTestId("file");
    //     const imageFile = new File(["invoice"], "invoice.jpeg", {
    //       type: "image/jpeg",
    //     });
    //     userEvent.upload(fileInput, imageFile);

    //     const onNavigate = (pathname) => {
    //       document.body.innerHTML = ROUTES({ pathname });
    //     };
    //     Object.defineProperty(window, "localStorage", {
    //       value: localStorageMock,
    //     });
    //     window.localStorage.setItem(
    //       "user",
    //       JSON.stringify({
    //         type: "Employee",
    //       })
    //     );
    //     const newBill = new NewBill({
    //       document: document,
    //       onNavigate: onNavigate,
    //       store: mockStore,
    //       localStorage: localStorageMock,
    //     });

    //     mockStore.bills.mockImplementationOnce(() => {
    //       return {
    //         update: () => {
    //           return Promise.reject(new Error("Erreur 500"));
    //         },
    //       };
    //     });
    //     const form = screen.getByTestId("form-new-bill");
    //     const handleSubmit = jest.fn(newBill.handleSubmit);

    //     form.addEventListener("submit", handleSubmit);
    //     fireEvent.submit(form);

    //     // await new Promise(process.nextTick);
    //     await waitFor(() => screen.getByText(/Erreur/));
    //     const message = screen.getByText(/Erreur/);
    //     expect(message).toBeTruthy();
    //   });
    // });
  });
});
