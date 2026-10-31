from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        data = response.data
        message = "An error occurred."
        errors = {}
        if isinstance(data, dict):
            if 'detail' in data:
                message = str(data['detail'])
                errors = {'detail': [message]}
            else:
                errors = data
                first_key = next(iter(data))
                first_val = data[first_key]
                message = f"{first_key}: {first_val[0]}" if isinstance(first_val, list) and first_val else f"{first_key}: {first_val}"
        elif isinstance(data, list) and data:
            message = str(data[0])
            errors = {'non_field_errors': data}

        response.data = {
            'success': False,
            'message': message,
            'errors': errors
        }
    return response

def success_response(data=None, message="Success", status_code=status.HTTP_200_OK):
    payload = {'success': True, 'message': message}
    if data is not None:
        payload['data'] = data
    return Response(payload, status=status_code)

def error_response(message="An error occurred", status_code=status.HTTP_400_BAD_REQUEST, errors=None):
    payload = {'success': False, 'message': message}
    if errors is not None:
        payload['errors'] = errors
    return Response(payload, status=status_code)
