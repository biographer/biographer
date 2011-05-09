#include <stdint.h>
#include <stdio.h>

int main(){
        printf("int64_t %i\n",sizeof(int64_t));

	printf("int32_t %i\n",sizeof(int32_t));
        printf("int16_t %i\n",sizeof(int16_t));
        printf("int8_t %i\n",sizeof(int8_t));

        printf("long %i\n",sizeof(long));

        printf("int %i\n",sizeof(int));
        printf("short %i\n",sizeof(short));
        printf("char %i\n",sizeof(char));

	return 0;
}
