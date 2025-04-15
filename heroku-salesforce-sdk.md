# Heroku Salesforce SDK Usage

This document outlines how to use the `@heroku/salesforce-sdk-nodejs` package, focusing on connecting to a Salesforce org and creating records.

## Overview

Unlike libraries like `jsforce` where you explicitly log in using credentials, the `@heroku/salesforce-sdk-nodejs` appears designed to work within an environment where Salesforce authentication context is implicitly provided. This is common in contexts like Salesforce Functions or integrations invoked by Salesforce events.

The SDK provides access to the Salesforce org's data and metadata through `Context` and `Org` objects, which are expected to be available in the execution environment.

## Accessing the Salesforce Org Context

The primary way to interact with Salesforce is through the `Context` object, typically passed to your function or handler. From the `Context`, you can access the `Org` object, which contains the `DataApi`.

```javascript
// Assuming 'context' is provided by the execution environment
// For example, in a Salesforce Function:
// module.exports = async function (event, context, logger) { ... }

const org = context.org;
if (!org) {
  throw new Error('Salesforce Org context not found.');
}

const dataApi = org.dataApi;
```

## Creating Records

To create a new Salesforce record, use the `create` method on the `dataApi` object. You need to provide the object's API name (`type`) and a map of its `fields`.

```javascript
// Assuming 'dataApi' is obtained as shown above

async function createIntegrationRecord(dataApi, recordData) {
  try {
    // Define the record to be created
    const recordToCreate = {
      type: 'Integration__c', // API name of the Salesforce object
      fields: recordData // An object like { Name: 'Example', CustomField__c: 'Value' }
    };

    // Create the record
    const result = await dataApi.create(recordToCreate);

    console.log(`Successfully created Integration__c record with ID: ${result.id}`);
    return result;
  } catch (error) {
    console.error(`Failed to create Integration__c record: ${error.message}`);
    // Handle or re-throw the error appropriately
    throw error;
  }
}

// Example Usage:
const newRecordData = {
  Name: 'My New Integration Record',
  Status__c: 'Pending',
  External_ID__c: 'XYZ-123'
};

// Assuming context and logger are available
// createIntegrationRecord(context.org.dataApi, newRecordData)
//   .then(result => { /* ... */ })
//   .catch(error => { /* ... */ });
```

### `RecordForCreate` Structure

The object passed to `dataApi.create` should match the `RecordForCreate` type:

-   `type`: (String) The API name of the SObject (e.g., `'Account'`, `'Contact'`, `'MyCustomObject__c'`).
-   `fields`: (Object) A key-value map where keys are the API names of the fields and values are the data to insert.

## Querying Records

Use the `dataApi.query()` method with a SOQL string to retrieve records.

```javascript
async function findAccountsByName(dataApi, accountName) {
  try {
    const soql = `SELECT Id, Name, Industry FROM Account WHERE Name = '${accountName}'`;
    const results = await dataApi.query(soql);

    if (results.done && results.totalSize > 0) {
      console.log(`Found ${results.totalSize} account(s):`);
      results.records.forEach(record => {
        console.log(`- ID: ${record.fields.Id}, Name: ${record.fields.Name}, Industry: ${record.fields.Industry}`);
      });
      return results.records;
    } else if (results.done) {
      console.log(`No accounts found with name: ${accountName}`);
      return [];
    } else {
      // Handle pagination if needed (results.done is false)
      console.log('Query results are not complete, pagination needed.');
      // You might need dataApi.queryMore(results) here in a loop
      return results.records; // Returning partial results for now
    }
  } catch (error) {
    console.error(`Failed to query Accounts: ${error.message}`);
    throw error;
  }
}

// Example Usage:
// findAccountsByName(context.org.dataApi, 'Acme Corporation')
//   .then(records => { /* ... */ })
//   .catch(error => { /* ... */ });
```

### Query Results Structure

The object returned by `dataApi.query` contains:

-   `done`: (Boolean) `true` if all results are included, `false` if more results can be retrieved using `queryMore`.
-   `totalSize`: (Number) The total number of records matching the query.
-   `records`: (Array) An array of matching records. Each record object has:
    -   `type`: (String) The SObject type.
    -   `fields`: (Object) A map of field names to their values for the queried fields.
-   `nextRecordsUrl`: (String, Optional) If `done` is `false`, this URL can be used with direct API calls (though `dataApi.queryMore()` is the SDK way).

## Updating Records

Use `dataApi.update()` to modify existing records. You must include the `Id` field in the `fields` object.

```javascript
async function updateAccountIndustry(dataApi, accountId, newIndustry) {
  try {
    const recordToUpdate = {
      type: 'Account',
      fields: {
        Id: accountId,
        Industry: newIndustry
      }
    };

    const result = await dataApi.update(recordToUpdate);
    console.log(`Successfully updated Account ID: ${result.id}`); // Note: update returns the ID, not a full success object like create
    return result; // The result only contains the 'id'
  } catch (error) {
    console.error(`Failed to update Account ${accountId}: ${error.message}`);
    throw error;
  }
}

// Example Usage:
// updateAccountIndustry(context.org.dataApi, '001xxxxxxxxxxxxxxx', 'Technology')
//   .then(result => { /* ... */ })
//   .catch(error => { /* ... */ });
```

## Deleting Records

Use `dataApi.delete()` with the SObject `type` and the record `Id`.

```javascript
async function deleteContactById(dataApi, contactId) {
  try {
    const result = await dataApi.delete('Contact', contactId);
    console.log(`Successfully deleted Contact ID: ${result.id}`); // Delete also returns just the 'id'
    return result;
  } catch (error) {
    console.error(`Failed to delete Contact ${contactId}: ${error.message}`);
    throw error;
  }
}

// Example Usage:
// deleteContactById(context.org.dataApi, '003xxxxxxxxxxxxxxx')
//   .then(result => { /* ... */ })
//   .catch(error => { /* ... */ });

```

## Unit of Work (Transactions)

The SDK supports bundling multiple DML operations (create, update, delete) into a single transaction using a `UnitOfWork`. This ensures that all operations succeed or fail together.

```javascript
async function createAccountAndContactAtomic(dataApi, accountData, contactData) {
  const uow = dataApi.newUnitOfWork();

  try {
    // 1. Register a new Account creation
    const accountRef = uow.registerCreate({
      type: 'Account',
      fields: accountData // e.g., { Name: 'New Corp', Industry: 'Retail' }
    });

    // 2. Register a new Contact creation, linking it to the Account
    //    using the ReferenceId from the previous step.
    const contactRef = uow.registerCreate({
      type: 'Contact',
      fields: {
        ...contactData, // e.g., { FirstName: 'Jane', LastName: 'Doe', Email: 'jane.doe@newcorp.com' }
        AccountId: accountRef // Link Contact to the Account being created in this UoW
      }
    });

    // 3. Commit the Unit of Work
    // This sends all registered operations to Salesforce in a single request.
    const results = await dataApi.commitUnitOfWork(uow);

    // Results is a Map<ReferenceId, RecordModificationResult>
    const accountResult = results.get(accountRef);
    const contactResult = results.get(contactRef);

    console.log(`Atomic operation successful!`);
    console.log(`- Created Account ID: ${accountResult?.id}`);
    console.log(`- Created Contact ID: ${contactResult?.id}`);

    return { accountId: accountResult?.id, contactId: contactResult?.id };

  } catch (error) {
    console.error(`Unit of Work failed: ${error.message}`);
    // If commitUnitOfWork fails, Salesforce rolls back all operations in the unit.
    throw error;
  }
}

// Example Usage:
const newAccount = { Name: 'Atomic Inc.', Industry: 'Manufacturing' };
const newContact = { FirstName: 'John', LastName: 'Smith', Email: 'j.smith@atomic.inc' };

// createAccountAndContactAtomic(context.org.dataApi, newAccount, newContact)
//   .then(ids => { /* ... */ })
//   .catch(error => { /* ... */ });
```

### Unit of Work Steps:

1.  **Create Unit of Work:** `const uow = dataApi.newUnitOfWork();`
2.  **Register Operations:** Use `uow.registerCreate()`, `uow.registerUpdate()`, or `uow.registerDelete()`. Each registration returns a `ReferenceId`.
3.  **Link Operations (Optional):** Use the `ReferenceId` from one step as a field value in another (e.g., setting `AccountId` on a Contact to the `ReferenceId` of an Account created in the same unit).
4.  **Commit:** `await dataApi.commitUnitOfWork(uow);` This executes the transaction.
5.  **Process Results:** The `commit` method returns a `Map` where keys are the `ReferenceId`s and values are `RecordModificationResult` objects (containing the `id` of the created/updated record).

## Comparing with `jsforce`

The key difference from your `jsforce` example is the **authentication and connection management**:

-   **`jsforce`**: Requires explicit login using `username`, `password`, and potentially a `securityToken`. You manage the connection lifecycle (`connect`, `disconnect`).
-   **`@heroku/salesforce-sdk-nodejs`**: Assumes an authenticated context (`Context`, `Org`) is provided by the environment. There's no explicit `login` or `connect` method exposed in the main interfaces. Record creation is done via the `dataApi` obtained from the context.

Therefore, you wouldn't directly replace the `jsforce.Connection` and `conn.login(...)` parts. Instead, your code would expect the `context` object to be passed in, and you'd use `context.org.dataApi` where you previously used the `jsforce` connection object (`this.conn`).
