import { test, expect } from 'playwright-test-coverage';

test('setup', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() == 'DELETE') {
        expect(route.request().method()).toBe('DELETE');
        const logoutRes = { message: 'logout successful' };
        await route.fulfill({ json: logoutRes });
    }
    else {
      const registerReq = { name: 'diner', email: 'd@jwt.com', password: 'diner' };
      const registerRes = { user: { id: 4, name: 'diner', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toMatchObject(registerReq);
      await route.fulfill({ json: registerRes });
    }
  });
  page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await expect(page.getByRole('heading')).toContainText('Welcome to the party');
  await page.getByRole('textbox', { name: 'Full name' }).fill('diner');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Logout');
  await page.getByRole('link', { name: 'logout' }).click();
  await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
});

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('buy pizza with login', async ({ page }) => {
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() == 'DELETE') {
      expect(route.request().method()).toBe('DELETE');
      const logoutRes = { message: 'logout successful' };
      await route.fulfill({ json: logoutRes });
    }
    else {
      const loginReq = { email: 'f@jwt.com', password: 'franchisee' };
      const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'f@jwt.com', roles: [{ role: 'diner' }, {objectId: 1, role: 'franchisee' }] }, token: 'abcdef' };
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Order now' }).click();
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading')).toContainText('So worth it');
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page.getByRole('heading')).toContainText('Here is your JWT Pizza!');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.locator('#hs-jwt-modal')).toContainText('Close');
  await page.getByRole('link', { name: 'logout' }).click();
  await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
});

test('purchase with login', async ({ page }) => {
    await page.route('*/**/api/order/menu', async (route) => {
      const menuRes = [
        { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
        { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
      ];
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: menuRes });
    });
  
    await page.route('*/**/api/franchise', async (route) => {
      const franchiseRes = [
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ];
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: franchiseRes });
    });
  
    await page.route('*/**/api/auth', async (route) => {
      if (route.request().method() == 'DELETE') {
        expect(route.request().method()).toBe('DELETE');
        const logoutRes = { message: 'logout successful' };
        await route.fulfill({ json: logoutRes });
      }
      else {
        const loginReq = { email: 'd@jwt.com', password: 'diner' };
        const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
      }
    });
  
    await page.route('*/**/api/order', async (route) => {
      const orderReq = {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
      };
      const orderRes = {
        order: {
          items: [
            { menuId: 1, description: 'Veggie', price: 0.0038 },
            { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          ],
          storeId: '4',
          franchiseId: 2,
          id: 23,
        },
        jwt: 'eyJpYXQ',
      };
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toMatchObject(orderReq);
      await route.fulfill({ json: orderRes });
    });
  
    await page.goto('/');
  
    // Go to order page
    await page.getByRole('button', { name: 'Order now' }).click();
  
    // Create order
    await expect(page.locator('h2')).toContainText('Awesome is a click away');
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await expect(page.locator('form')).toContainText('Selected pizzas: 2');
    await page.getByRole('button', { name: 'Checkout' }).click();
  
    // Login
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
  
    // Pay
    await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
    await expect(page.locator('tbody')).toContainText('Veggie');
    await expect(page.locator('tbody')).toContainText('Pepperoni');
    await expect(page.locator('tfoot')).toContainText('0.008 ₿');
    await page.getByRole('button', { name: 'Pay now' }).click();
  
    // Check balance
    await expect(page.getByText('0.008')).toBeVisible();
    await page.getByRole('link', { name: 'logout' }).click();
    await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
});

test('register diner', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() == 'DELETE') {
        expect(route.request().method()).toBe('DELETE');
        const logoutRes = { message: 'logout successful' };
        await route.fulfill({ json: logoutRes });
    }
    else {
      const registerReq = { name: 'diner', email: 'd@jwt.com', password: 'diner' };
      const registerRes = { user: { id: 4, name: 'diner', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toMatchObject(registerReq);
      await route.fulfill({ json: registerRes });
    }
  });

  await page.goto('/');
  await expect(page.locator('#navbar-dark')).toContainText('Register');
  await page.getByRole('link', { name: 'Register' }).click();
  await expect(page.getByRole('heading')).toContainText('Welcome to the party');
  await page.getByRole('textbox', { name: 'Full name' }).fill('diner');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Logout');
  await page.getByRole('link', { name: 'logout' }).click();
  await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
});

test('about', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('main')).toContainText('The secret sauce');
})

test('history', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByRole('heading')).toContainText('Mama Rucci, my my');
});

test('franchise dashboard with login', async ({ page }) => {
    await page.route('*/**/api/auth', async (route) => {
      if (route.request().method() == 'DELETE') {
        expect(route.request().method()).toBe('DELETE');
        const logoutRes = { message: 'logout successful' };
        await route.fulfill({ json: logoutRes });
      }
      else {
        const loginReq = { email: 'f@jwt.com', password: 'franchisee' };
        const loginRes = { user: { id: 3, name: 'pizza franchisee', email: 'f@jwt.com', roles: [{ role: 'diner' }, { objectId: 1, role: 'franchisee' }] }, token: 'abcdeg' };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
      }
    });
    
    await page.route('*/**/api/franchise/*', async (route) => {
       const franchiseRes = [{ id: 1, 
                              name: 'pizzaPocket', 
                              admins: [{ id: 3, name: 'pizza franchisee', email: 'f@jwt.com' }], 
                              stores: [{ id: 1, name: 'SLC', totalRevenue: 0.2606 }, { id: 29, name: 'Orem', totalRevenue: 0 }] }];
       expect(route.request().method()).toBe('GET');
       expect(route.request().headers()['authorization']).toBe('Bearer abcdeg');
       await route.fulfill({ json: franchiseRes, 
                             headers: { 'Content-Type': 'application/json' }});
    });
    
    await page.goto('/');
    await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
    await page.getByRole('link', { name: 'login' }).click();
    await expect(page.getByRole('heading')).toContainText('Welcome back');
    await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('#navbar-dark')).toContainText('Logout');
    await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
    await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
    //await page.waitForURL('**/franchise-dashboard');
    await expect(page.getByRole('heading')).toContainText('pizzaPocket');
    await page.getByRole('link', { name: 'logout' }).click();
    await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
});

test('create store with login', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() == 'DELETE') {
      expect(route.request().method()).toBe('DELETE');
      const logoutRes = { message: 'logout successful' };
      await route.fulfill({ json: logoutRes });
    }
    else {
      const loginReq = { email: 'f@jwt.com', password: 'franchisee' };
      const loginRes = { user: { id: 3, name: 'pizza franchisee', email: 'f@jwt.com', roles: [{ role: 'diner' }, { objectId: 1, role: 'franchisee' }] }, token: 'abcdeg' };
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
  });

  await page.route('*/**/api/franchise/*', async (route) => {
    const franchiseRes = [{ id: 1, 
                         name: 'pizzaPocket', 
                         admins: [{ id: 3, name: 'pizza franchisee', email: 'f@jwt.com' }], 
                         stores: [{ id: 1, name: 'SLC', totalRevenue: 0.2606 }, { id: 29, name: 'Orem', totalRevenue: 0 }] }];
    expect(route.request().method()).toBe('GET');
    expect(route.request().headers()['authorization']).toBe('Bearer abcdeg');
    await route.fulfill({ json: franchiseRes, 
                        headers: { 'Content-Type': 'application/json' }});
  });

  await page.route('*/**/api/franchise/*/store', async (route) => {
    const createStoreRes = { id: 2, franchiseId: 1, name: 'Provo'}
    expect(route.request().method()).toBe('POST');
    expect(route.request().headers()['authorization']).toBe('Bearer abcdeg');
    await route.fulfill({ json: createStoreRes, headers: { 'Content-Type': 'application/json' }});
  });


  await page.goto('/');
  await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByRole('main')).toContainText('So you want a piece of the pie?');
  await page.getByRole('link', { name: 'login', exact: true }).click();
  await expect(page.getByRole('heading')).toContainText('Welcome back');
  await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/franchise-dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(0.5);
  await expect(page.getByRole('heading')).toContainText('pizzaPocket');
  await page.getByRole('button', { name: 'Create store' }).click();
  await page.waitForURL('**/franchise-dashboard/create-store');
  await expect(page.getByRole('heading')).toContainText('Create store');
  await page.getByRole('textbox', { name: 'store name' }).click();
  await page.getByRole('textbox', { name: 'store name' }).fill('Provo');
  await page.getByRole('button', { name: 'Create' }).click();
  await page.waitForURL('**/franchise-dashboard');
  await page.waitForTimeout(1);
  //await expect(page.getByRole('heading')).toContainText('pizzaPocket');
  await page.getByRole('link', { name: 'logout' }).click();
  await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
});

test('profile with login', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() == 'DELETE') {
      expect(route.request().method()).toBe('DELETE');
      const logoutRes = { message: 'logout successful' };
      await route.fulfill({ json: logoutRes });
    }
    else {
      const loginReq = { email: 'd@jwt.com', password: 'diner' };
      const loginRes = { user: { id: 3, name: 'pizza diner', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
  });
    await page.goto('/');
    await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page.getByRole('heading')).toContainText('Welcome back');
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('#navbar-dark')).toContainText('Logout');
    await page.getByRole('link', { name: 'pd' }).click();
    await expect(page.getByRole('heading')).toContainText('Your pizza kitchen');
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
});

test('admin', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() == 'DELETE') {
      expect(route.request().method()).toBe('DELETE');
      const logoutRes = { message: 'logout successful' };
      await route.fulfill({ json: logoutRes });
    }
    else {
      const loginReq = { email: 'a@jwt.com', password: 'admin' };
      const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'a@jwt.com', roles: [{ role: 'admin' }] }, token: 'abcdef' };
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
  });
  await page.goto('/');
  await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
  await page.getByRole('link', { name: 'Login' }).click();
  await expect(page.getByRole('heading')).toContainText('Welcome back');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Admin');
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('heading')).toContainText('Mama Ricci\'s kitchen');
  await page.getByRole('link', { name: 'logout' }).click();
  await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
});