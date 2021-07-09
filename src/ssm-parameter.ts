import SSM from 'aws-sdk/clients/ssm';

export async function getSSMParameter(parameterName: string) {
  const ssm = new SSM();

  return new Promise<string>((resolve, reject) => {
    ssm.getParameter(
      {
        Name: parameterName,
      },
      (err, data) => {
        if (err) return reject(err);
        else {
          return resolve(data.Parameter!.Value!);
        }
      }
    );
  });
}

export async function updateSSMParameter(
  parameterName: string,
  newValue: string
) {
  const ssm = new SSM();

  return new Promise<void>((resolve, reject) => {
    ssm.putParameter(
      {
        Name: parameterName,
        Value: newValue,
        Overwrite: true,
      },
      (error) => {
        if (error) return reject(error);
        else resolve();
      }
    );
  });
}
